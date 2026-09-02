import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Action = 'approve' | 'reject' | 'request_clarification'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Validate caller JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get caller's employee record
    const { data: approverEmp } = await supabase
      .from('employees')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (!approverEmp || !['manager', 'hr_admin', 'super_admin'].includes(approverEmp.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { nomination_id, action, reason, clarification_note } =
      await req.json() as {
        nomination_id: string
        action: Action
        approver_id: string
        reason?: string
        clarification_note?: string
      }

    if (!nomination_id || !action) {
      return new Response(JSON.stringify({ error: 'nomination_id and action required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'reject' && !reason) {
      return new Response(JSON.stringify({ error: 'reason required for rejection' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'request_clarification' && !clarification_note) {
      return new Response(JSON.stringify({ error: 'clarification_note required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch nomination
    const { data: nomination } = await supabase
      .from('nominations')
      .select('*, nominator:nominator_id(id, full_name), nominee:nominee_id(id, full_name)')
      .eq('id', nomination_id)
      .single()

    if (!nomination) {
      return new Response(JSON.stringify({ error: 'Nomination not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify caller is authorized approver
    const isAuthorized =
      nomination.assigned_approver_id === approverEmp.id ||
      ['hr_admin', 'super_admin'].includes(approverEmp.role)

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'You are not the assigned approver for this nomination' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const now = new Date().toISOString()

    if (action === 'approve') {
      // Update nomination to approved
      const { error: updateError } = await supabase
        .from('nominations')
        .update({
          status: 'approved',
          approved_by_id: approverEmp.id,
          approved_at: now,
          published_at: now,
        })
        .eq('id', nomination_id)

      if (updateError) throw updateError

      // Create notifications
      await createNotification(supabase, {
        recipient_id: nomination.nominee_id,
        type: 'recognition_received',
        title: 'You received a recognition',
        body: `${(nomination.nominator as { full_name: string }).full_name} recognized you for ${nomination.snapshot_core_value_name}.`,
        related_id: nomination_id,
        related_type: 'nomination',
      })

      await createNotification(supabase, {
        recipient_id: nomination.nominator_id,
        type: 'nomination_approved',
        title: 'Your recognition was approved',
        body: `Your recognition of ${(nomination.nominee as { full_name: string }).full_name} has been approved and published.`,
        related_id: nomination_id,
        related_type: 'nomination',
      })

      // Calculate badges for nominee
      await calculateBadges(supabase, nomination.nominee_id, nomination.core_value_id)

      // Check anti-gaming (reciprocal recognition flag)
      await checkReciprocalPattern(supabase, nomination.nominator_id, nomination.nominee_id)

      // Write audit log
      await writeAuditLog(supabase, {
        actor_id: approverEmp.id,
        action: 'nomination_approved',
        entity_type: 'nomination',
        entity_id: nomination_id,
        new_value: { status: 'approved', approved_by: approverEmp.id },
      })

    } else if (action === 'reject') {
      const { error: updateError } = await supabase
        .from('nominations')
        .update({
          status: 'rejected',
          rejected_by_id: approverEmp.id,
          rejected_at: now,
          rejection_reason: reason,
        })
        .eq('id', nomination_id)

      if (updateError) throw updateError

      // Notify nominator only (not nominee — privacy rule)
      await createNotification(supabase, {
        recipient_id: nomination.nominator_id,
        type: 'nomination_rejected',
        title: 'Your recognition was not approved',
        body: `Your recognition of ${(nomination.nominee as { full_name: string }).full_name} for ${nomination.snapshot_core_value_name} was not approved.`,
        related_id: nomination_id,
        related_type: 'nomination',
      })

      await writeAuditLog(supabase, {
        actor_id: approverEmp.id,
        action: 'nomination_rejected',
        entity_type: 'nomination',
        entity_id: nomination_id,
        new_value: { status: 'rejected', rejected_by: approverEmp.id },
      })

    } else if (action === 'request_clarification') {
      const { error: updateError } = await supabase
        .from('nominations')
        .update({
          status: 'clarification_requested',
          clarification_requested_at: now,
          clarification_note,
        })
        .eq('id', nomination_id)

      if (updateError) throw updateError

      await createNotification(supabase, {
        recipient_id: nomination.nominator_id,
        type: 'clarification_requested',
        title: 'Clarification requested on your recognition',
        body: `More detail has been requested on your recognition of ${(nomination.nominee as { full_name: string }).full_name}. Please update your submission.`,
        related_id: nomination_id,
        related_type: 'nomination',
      })

      await writeAuditLog(supabase, {
        actor_id: approverEmp.id,
        action: 'nomination_clarification_requested',
        entity_type: 'nomination',
        entity_id: nomination_id,
        new_value: { status: 'clarification_requested' },
      })
    }

    return new Response(JSON.stringify({ success: true, action }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('process-approval error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// ── Helpers ─────────────────────────────────────────────────

async function createNotification(
  supabase: ReturnType<typeof createClient>,
  notification: {
    recipient_id: string
    type: string
    title: string
    body: string
    related_id?: string
    related_type?: string
  }
) {
  await supabase.from('notifications').insert(notification)
}

async function calculateBadges(
  supabase: ReturnType<typeof createClient>,
  employeeId: string,
  coreValueId: string
) {
  const now = new Date()
  const yearStart = `${now.getFullYear()}-01-01`
  const yearEnd   = `${now.getFullYear()}-12-31`

  // Count approved recognitions for this employee × core value in the annual period
  const { count: total } = await supabase
    .from('nominations')
    .select('id', { count: 'exact', head: true })
    .eq('nominee_id', employeeId)
    .eq('core_value_id', coreValueId)
    .eq('status', 'approved')
    .gte('approved_at', yearStart)
    .lte('approved_at', yearEnd)

  // Count unique nominators — fetch all nominator_ids and deduplicate in-memory
  // (Supabase JS v2 does not support COUNT(DISTINCT) natively)
  const { data: nominatorRows } = await supabase
    .from('nominations')
    .select('nominator_id')
    .eq('nominee_id', employeeId)
    .eq('core_value_id', coreValueId)
    .eq('status', 'approved')
    .gte('approved_at', yearStart)
    .lte('approved_at', yearEnd)

  const uniqueNominators = new Set((nominatorRows ?? []).map(r => r.nominator_id)).size

  const count = total ?? 0
  const { data: defs } = await supabase
    .from('badge_definitions')
    .select('level, minimum_count, maximum_count')
    .eq('is_active', true)
    .order('level', { ascending: false })

  let newLevel: number | null = null
  for (const def of (defs ?? [])) {
    if (count >= def.minimum_count && (def.maximum_count === null || count <= def.maximum_count)) {
      newLevel = def.level
      break
    }
  }

  // Get current badge
  const { data: current } = await supabase
    .from('employee_value_badges')
    .select('badge_level, id')
    .eq('employee_id', employeeId)
    .eq('core_value_id', coreValueId)
    .eq('period_type', 'annual')
    .eq('period_start', yearStart)
    .single()

  const currentLevel = current?.badge_level ?? null

  // Never downgrade
  const finalLevel = (newLevel !== null && currentLevel !== null && newLevel < currentLevel)
    ? currentLevel
    : newLevel

  // Upsert badge record
  await supabase.from('employee_value_badges').upsert({
    employee_id: employeeId,
    core_value_id: coreValueId,
    period_type: 'annual',
    period_start: yearStart,
    period_end: yearEnd,
    recognition_count: count,
    unique_recognizer_count: unique ?? 0,
    badge_level: finalLevel,
    last_updated: new Date().toISOString(),
  }, { onConflict: 'employee_id,core_value_id,period_type,period_start' })

  // Record badge history if level changed
  if (finalLevel !== null && finalLevel !== currentLevel) {
    await supabase.from('badge_history').insert({
      employee_id: employeeId,
      core_value_id: coreValueId,
      previous_level: currentLevel,
      new_level: finalLevel,
      recognition_count: count,
      achieved_at: new Date().toISOString(),
      period_type: 'annual',
      period_start: yearStart,
      period_end: yearEnd,
    })

    // Notify employee of badge unlock
    const { data: badgeDef } = await supabase
      .from('badge_definitions')
      .select('name')
      .eq('level', finalLevel)
      .single()

    const { data: cvData } = await supabase
      .from('core_values')
      .select('name')
      .eq('id', coreValueId)
      .single()

    const prevName = currentLevel
      ? (await supabase.from('badge_definitions').select('name').eq('level', currentLevel).single()).data?.name
      : null

    const body = prevName
      ? `You've progressed from ${prevName} → ${badgeDef?.name} for ${cvData?.name}.`
      : `You've unlocked ${badgeDef?.name} for ${cvData?.name}! You've been recognized ${count} time${count !== 1 ? 's' : ''} this year.`

    await supabase.from('notifications').insert({
      recipient_id: employeeId,
      type: 'badge_unlocked',
      title: `New badge unlocked: ${badgeDef?.name}`,
      body,
      related_id: employeeId,
      related_type: 'badge',
    })
  }
}

async function checkReciprocalPattern(
  supabase: ReturnType<typeof createClient>,
  nominatorId: string,
  nomineeId: string
) {
  // Check how many times nomineeId has recognized nominatorId (reciprocal)
  const { count } = await supabase
    .from('nominations')
    .select('id', { count: 'exact', head: true })
    .eq('nominator_id', nomineeId)
    .eq('nominee_id', nominatorId)
    .eq('status', 'approved')

  // Fetch threshold
  const { data: config } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'reciprocal_flag_threshold')
    .single()

  const threshold = Number(config?.value ?? 3)

  if ((count ?? 0) >= threshold) {
    // Upsert flag
    const { data: existing } = await supabase
      .from('reciprocal_recognition_flags')
      .select('id, count')
      .or(`employee_a_id.eq.${nominatorId},employee_a_id.eq.${nomineeId}`)
      .or(`employee_b_id.eq.${nominatorId},employee_b_id.eq.${nomineeId}`)
      .single()

    if (existing) {
      await supabase
        .from('reciprocal_recognition_flags')
        .update({ count: (existing.count ?? 0) + 1, last_flagged_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase.from('reciprocal_recognition_flags').insert({
        employee_a_id: nominatorId,
        employee_b_id: nomineeId,
        count: 1,
        last_flagged_at: new Date().toISOString(),
      })
    }
  }
}

async function writeAuditLog(
  supabase: ReturnType<typeof createClient>,
  log: {
    actor_id: string
    action: string
    entity_type: string
    entity_id: string
    previous_value?: Record<string, unknown>
    new_value?: Record<string, unknown>
  }
) {
  await supabase.from('audit_logs').insert({
    actor_id: log.actor_id,
    action: log.action,
    entity_type: log.entity_type,
    entity_id: log.entity_id,
    previous_value: log.previous_value ?? null,
    new_value: log.new_value ?? null,
  })
}

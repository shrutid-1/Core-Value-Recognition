/**
 * calculate-badges Edge Function
 * 
 * Calculates employee value badges after nominations are approved
 * Triggered by:
 * 1. POST /calculate-badges (manual trigger, e.g., after seeding)
 * 2. Could be triggered by database event (needs realtime setup)
 * 
 * Usage:
 * ```
 * curl -X POST https://your-project.supabase.co/functions/v1/calculate-badges \
 *   -H "Authorization: Bearer YOUR_ANON_KEY" \
 *   -H "Content-Type: application/json" \
 *   -d '{"force": true}'
 * ```
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface BadgeDefinition {
  level: number
  minimum_count: number
  maximum_count: number | null
}

interface RecognitionCount {
  employee_id: string
  core_value_id: string
  recognition_count: number
  unique_recognizer_count: number
}

/**
 * Calculate badge level based on recognition count
 */
function calculateBadgeLevel(
  count: number,
  badgeDefinitions: BadgeDefinition[]
): number | null {
  // Sort by minimum_count descending to find the highest applicable badge
  const sorted = [...badgeDefinitions].sort((a, b) => b.minimum_count - a.minimum_count)

  for (const badge of sorted) {
    if (count >= badge.minimum_count) {
      if (badge.maximum_count === null || count <= badge.maximum_count) {
        return badge.level
      }
    }
  }

  return null
}

/**
 * Get the current date period (annual or quarterly)
 */
function getCurrentPeriods(badgePeriodStartMonth: number, fyQ1StartMonth: number) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-12

  // Annual period
  const annualStart = new Date(currentYear, badgePeriodStartMonth - 1, 1)
  const annualEnd = new Date(currentYear + 1, badgePeriodStartMonth - 1, 0)

  // Quarterly period - determine which quarter we're in based on FY start
  let quarterStartMonth: number
  let quarterNumber: number

  if (currentMonth >= fyQ1StartMonth) {
    // Q1 of current fiscal year
    quarterNumber = 1
    quarterStartMonth = fyQ1StartMonth
  } else if (currentMonth >= fyQ1StartMonth + 3) {
    quarterNumber = 2
    quarterStartMonth = fyQ1StartMonth + 3
  } else if (currentMonth >= fyQ1StartMonth + 6) {
    quarterNumber = 3
    quarterStartMonth = fyQ1StartMonth + 6
  } else {
    quarterNumber = 4
    quarterStartMonth = fyQ1StartMonth + 9
  }

  const quarterStart = new Date(
    quarterStartMonth <= fyQ1StartMonth ? currentYear - 1 : currentYear,
    (quarterStartMonth - 1) % 12,
    1
  )
  const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0)

  return {
    annual: {
      period_type: 'annual',
      period_start: annualStart.toISOString().split('T')[0],
      period_end: annualEnd.toISOString().split('T')[0],
    },
    quarterly: {
      period_type: 'quarterly',
      period_start: quarterStart.toISOString().split('T')[0],
      period_end: quarterEnd.toISOString().split('T')[0],
    },
  }
}

/**
 * Main handler
 */
Deno.serve(async (req) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // Initialize Supabase client with service role (bypass RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const body = await req.json().catch(() => ({}))
    const force = body.force === true

    console.log(`[calculate-badges] Starting badge calculation (force=${force})`)

    // Fetch app config for badge periods
    const { data: appConfig, error: configError } = await supabase
      .from('app_config')
      .select('key, value')

    if (configError) throw configError

    const configMap = new Map(appConfig.map((c) => [c.key, c.value]))
    const badgePeriodStartMonth = configMap.get('badge_period_start_month') || 1
    const fyQ1StartMonth = configMap.get('financial_year_q1_start') || 4

    // Fetch badge definitions
    const { data: badges, error: badgesError } = await supabase
      .from('badge_definitions')
      .select('level, minimum_count, maximum_count')
      .order('level', { ascending: true })

    if (badgesError) throw badgesError

    const badgeMap = new Map(badges.map((b) => [b.level, b]))

    // Get current periods
    const periods = getCurrentPeriods(badgePeriodStartMonth, fyQ1StartMonth)

    // Fetch all recognized employees × core values with counts
    const { data: recognitionCounts, error: countsError } = await supabase.rpc(
      'get_recognition_counts',
      {
        period_start: periods.annual.period_start,
        period_end: periods.annual.period_end,
      }
    )

    if (countsError) {
      console.log('[calculate-badges] Falling back to manual query (function not found)')

      // Fallback: manual aggregation if RPC function doesn't exist
      const { data: nominations } = await supabase
        .from('nominations')
        .select('nominee_id, core_value_id, nominator_id')
        .eq('status', 'approved')
        .gte('approved_at', periods.annual.period_start)
        .lte('approved_at', periods.annual.period_end)

      // Group and count
      const countMap = new Map<string, RecognitionCount>()

      if (nominations) {
        for (const nom of nominations) {
          const key = `${nom.nominee_id}:${nom.core_value_id}`
          const existing = countMap.get(key) || {
            employee_id: nom.nominee_id,
            core_value_id: nom.core_value_id,
            recognition_count: 0,
            unique_recognizer_count: 0,
          }

          existing.recognition_count += 1

          // Track unique recognizers
          if (!existing.unique_recognizers) {
            existing.unique_recognizers = new Set()
          }
          existing.unique_recognizers.add(nom.nominator_id)
          existing.unique_recognizer_count = existing.unique_recognizers.size

          countMap.set(key, existing)
        }
      }

      var counts = Array.from(countMap.values())
    } else {
      var counts = recognitionCounts || []
    }

    console.log(`[calculate-badges] Found ${counts.length} employee-value combinations to process`)

    let badgesCreated = 0
    let badgesUpdated = 0
    let historyCreated = 0

    // Process each employee × core value
    for (const count of counts) {
      const badgeLevel = calculateBadgeLevel(count.recognition_count, badges)

      // Fetch or create employee_value_badge
      const { data: existingBadge, error: fetchError } = await supabase
        .from('employee_value_badges')
        .select('id, badge_level')
        .eq('employee_id', count.employee_id)
        .eq('core_value_id', count.core_value_id)
        .eq('period_type', 'annual')
        .eq('period_start', periods.annual.period_start)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error(`[calculate-badges] Error fetching badge:`, fetchError)
        continue
      }

      if (existingBadge) {
        // Update existing
        if (existingBadge.badge_level !== badgeLevel) {
          const { error: updateError } = await supabase
            .from('employee_value_badges')
            .update({
              recognition_count: count.recognition_count,
              unique_recognizer_count: count.unique_recognizer_count,
              badge_level: badgeLevel,
              last_updated: new Date().toISOString(),
            })
            .eq('id', existingBadge.id)

          if (updateError) {
            console.error(`[calculate-badges] Error updating badge:`, updateError)
          } else {
            badgesUpdated++

            // Record badge level change in history
            if (badgeLevel && existingBadge.badge_level !== badgeLevel) {
              const { error: historyError } = await supabase.from('badge_history').insert({
                employee_id: count.employee_id,
                core_value_id: count.core_value_id,
                previous_level: existingBadge.badge_level,
                new_level: badgeLevel,
                recognition_count: count.recognition_count,
                period_type: 'annual',
                period_start: periods.annual.period_start,
                period_end: periods.annual.period_end,
              })

              if (!historyError) {
                historyCreated++
              }
            }
          }
        }
      } else {
        // Create new
        const { error: insertError } = await supabase.from('employee_value_badges').insert({
          employee_id: count.employee_id,
          core_value_id: count.core_value_id,
          period_type: 'annual',
          period_start: periods.annual.period_start,
          period_end: periods.annual.period_end,
          recognition_count: count.recognition_count,
          unique_recognizer_count: count.unique_recognizer_count,
          badge_level: badgeLevel,
        })

        if (insertError) {
          console.error(`[calculate-badges] Error creating badge:`, insertError)
        } else {
          badgesCreated++

          // Record badge unlock in history
          if (badgeLevel) {
            const { error: historyError } = await supabase.from('badge_history').insert({
              employee_id: count.employee_id,
              core_value_id: count.core_value_id,
              previous_level: null,
              new_level: badgeLevel,
              recognition_count: count.recognition_count,
              period_type: 'annual',
              period_start: periods.annual.period_start,
              period_end: periods.annual.period_end,
            })

            if (!historyError) {
              historyCreated++
            }
          }
        }
      }
    }

    const result = {
      success: true,
      processed: counts.length,
      badges_created: badgesCreated,
      badges_updated: badgesUpdated,
      history_created: historyCreated,
    }

    console.log(`[calculate-badges] Complete:`, result)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[calculate-badges] Error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Use service role for rate limit queries
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

    const { nominator_id } = await req.json() as { nominator_id: string }
    if (!nominator_id) {
      return new Response(JSON.stringify({ error: 'nominator_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch limits from config
    const { data: configs } = await supabase
      .from('app_config')
      .select('key, value')
      .in('key', ['rate_limit_daily', 'rate_limit_monthly'])

    const configMap = Object.fromEntries(
      (configs ?? []).map(c => [c.key, Number(c.value)])
    )
    const dailyLimit = configMap['rate_limit_daily'] ?? 5
    const monthlyLimit = configMap['rate_limit_monthly'] ?? 20

    // Count today's submissions
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const todayEnd   = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

    const { count: todayCount } = await supabase
      .from('nominations')
      .select('id', { count: 'exact', head: true })
      .eq('nominator_id', nominator_id)
      .gte('created_at', todayStart)
      .lt('created_at', todayEnd)

    if ((todayCount ?? 0) >= dailyLimit) {
      return new Response(JSON.stringify({
        allowed: false,
        reason: 'daily_limit_reached',
        limit: dailyLimit,
        message: `You've reached your daily recognition limit of ${dailyLimit}. Please come back tomorrow.`,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Count this month's submissions
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
    const monthEnd   = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString()

    const { count: monthCount } = await supabase
      .from('nominations')
      .select('id', { count: 'exact', head: true })
      .eq('nominator_id', nominator_id)
      .gte('created_at', monthStart)
      .lt('created_at', monthEnd)

    if ((monthCount ?? 0) >= monthlyLimit) {
      return new Response(JSON.stringify({
        allowed: false,
        reason: 'monthly_limit_reached',
        limit: monthlyLimit,
        message: `You've reached your monthly recognition limit of ${monthlyLimit}. Your limit resets next month.`,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ allowed: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('check-rate-limits error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

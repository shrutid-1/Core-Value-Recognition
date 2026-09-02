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

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { nominator_id, nominee_id, core_value_id } = await req.json() as {
      nominator_id: string
      nominee_id: string
      core_value_id: string
    }

    // Fetch anti-gaming window from config
    const { data: config } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'anti_gaming_window_days')
      .single()

    const windowDays = Number(config?.value ?? 30)
    const since = new Date()
    since.setDate(since.getDate() - windowDays)

    // Check for any prior approved recognition from this nominator → nominee × same core value in window
    const { count } = await supabase
      .from('nominations')
      .select('id', { count: 'exact', head: true })
      .eq('nominator_id', nominator_id)
      .eq('nominee_id', nominee_id)
      .eq('core_value_id', core_value_id)
      .eq('status', 'approved')
      .gte('approved_at', since.toISOString())

    const isDuplicate = (count ?? 0) > 0

    return new Response(JSON.stringify({
      is_duplicate: isDuplicate,
      window_days: windowDays,
      message: isDuplicate
        ? `You recently recognized this colleague for the same Core Value. You may continue with a different example, but please note this may not be approved.`
        : null,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('check-duplicate error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

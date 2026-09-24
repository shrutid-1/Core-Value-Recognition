import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5174',      // Development (Vite default port)
  'http://localhost:3000',      // Development (alternative)
  'http://localhost:8080',      // Development (alternative)
  'https://core-value-recognition.vercel.app',  // Production (Vercel)
]

// Check if SUPABASE_FRONTEND_URL is set for production
const prodUrl = Deno.env.get('SUPABASE_FRONTEND_URL')
if (prodUrl) {
  allowedOrigins.push(prodUrl)
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && allowedOrigins.includes(origin)
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://core-value-recognition.vercel.app',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  }
}

interface ProvisioningResult {
  employees_processed: number
  accounts_created: number
  existing_accounts_linked: number
  skipped: number
  failures: number
  errors: Array<{ employee_id: string; email: string; error: string }>
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Validate caller JWT and check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get caller's employee record and verify role
    const { data: callerEmp } = await supabase
      .from('employees')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (!callerEmp || !['hr_admin', 'super_admin'].includes(callerEmp.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body for optional targeted provisioning
    let targetEmployeeId: string | null = null
    let targetEmployeeEmail: string | null = null
    
    if (req.method === 'POST') {
      try {
        const body = await req.json() as {
          employee_id?: string
          employee_email?: string
        }
        targetEmployeeId = body.employee_id ?? null
        targetEmployeeEmail = body.employee_email ?? null
      } catch {
        // No JSON body or invalid JSON; continue with bulk mode
      }
    }

    // Build query for eligible employees
    // For targeted provisioning, we relax the auth_user_id filter to allow re-provisioning or fixing existing links
    // For bulk mode, we only process employees without auth_user_id
    
    let query = supabase
      .from('employees')
      .select('id, email, full_name, role, auth_user_id, is_active')
      .eq('is_active', true)
      .not('email', 'is', null)

    // Apply targeted filter if provided (targeted allows any auth_user_id status)
    if (targetEmployeeId) {
      query = query.eq('id', targetEmployeeId)
      console.error(`[provision-employees] Targeted provisioning for employee_id: ${targetEmployeeId}`)
    } else if (targetEmployeeEmail) {
      query = query.ilike('email', targetEmployeeEmail)
      console.error(`[provision-employees] Targeted provisioning for employee_email: ${targetEmployeeEmail}`)
    } else {
      // Bulk mode: only process employees without auth_user_id
      query = query.is('auth_user_id', null)
      query = query.order('created_at', { ascending: true }).limit(100)
      console.error(`[provision-employees] Bulk provisioning mode (limit 100)`)
    }

    const { data: eligibleEmployees, error: fetchError } = await query

    if (fetchError) {
      throw new Error(`Failed to fetch employees: ${fetchError.message}`)
    }

    // Add diagnostic logging for targeted provisioning
    if (targetEmployeeId || targetEmployeeEmail) {
      console.error(`[provision-employees] Targeted lookup result: found ${eligibleEmployees?.length || 0} employee(s)`)
      if (!eligibleEmployees || eligibleEmployees.length === 0) {
        console.error(`[provision-employees] Query conditions: is_active=true, email IS NOT NULL`)
        if (targetEmployeeId) {
          console.error(`[provision-employees] Target employee_id: ${targetEmployeeId}`)
        }
        if (targetEmployeeEmail) {
          console.error(`[provision-employees] Target employee_email: ${targetEmployeeEmail}`)
        }
      } else {
        // Log the employee details for debugging
        eligibleEmployees.forEach((emp: any) => {
          console.error(`[provision-employees] Found employee: id=${emp.id}, email=${emp.email}, auth_user_id=${emp.auth_user_id || 'NULL'}, is_active=${emp.is_active}`)
        })
      }
    }

    if (!eligibleEmployees || eligibleEmployees.length === 0) {
      return new Response(JSON.stringify({
        employees_processed: 0,
        accounts_created: 0,
        existing_accounts_linked: 0,
        skipped: 0,
        failures: 0,
        errors: [],
        message: 'No eligible employees to provision',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result: ProvisioningResult = {
      employees_processed: eligibleEmployees.length,
      accounts_created: 0,
      existing_accounts_linked: 0,
      skipped: 0,
      failures: 0,
      errors: [],
    }

    const adminAuthClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Process each eligible employee
    for (const emp of eligibleEmployees) {
      try {
        console.error(`[provision-employees] Processing employee: id=${emp.id}, email=${emp.email}, current_auth_user_id=${emp.auth_user_id || 'NULL'}`)

        // STEP 1: Search for existing Auth user by exact normalized email match
        console.error(`[provision-employees] Searching for existing Auth user with email: ${emp.email}`)
        let existingAuthUser = null

        try {
          const { data: authUsers, error: listError } = await adminAuthClient.auth.admin.listUsers()

          if (listError) {
            throw new Error(`Failed to list auth users: ${listError.message}`)
          }

          if (!authUsers || authUsers.length === 0) {
            console.error(`[provision-employees] No Auth users found in system`)
          } else {
            console.error(`[provision-employees] Total Auth users in system: ${authUsers.length}`)
          }

          // Find exact email match (normalized to lowercase and trimmed for comparison)
          const normalizedEmail = emp.email.toLowerCase().trim()
          console.error(`[provision-employees] Looking for Auth user with normalized email: ${normalizedEmail}`)
          
          existingAuthUser = authUsers?.find(u => {
            const authEmail = u.email?.toLowerCase().trim()
            const isMatch = authEmail === normalizedEmail
            if (isMatch) {
              console.error(`[provision-employees] Email match found: Auth user email="${u.email}" matches employee email="${emp.email}"`)
            }
            return isMatch
          })

          if (existingAuthUser) {
            console.error(`[provision-employees] ✅ Found existing Auth user: id=${existingAuthUser.id}, email=${existingAuthUser.email}`)
          } else {
            console.error(`[provision-employees] ❌ No existing Auth user found for email: ${emp.email}`)
          }
        } catch (searchErr) {
          throw new Error(`Failed to search for existing Auth user: ${searchErr instanceof Error ? searchErr.message : String(searchErr)}`)
        }

        // STEP 2: If existing Auth user found, verify and link it
        if (existingAuthUser) {
          if (!existingAuthUser.id) {
            throw new Error('Existing Auth user found but has no ID')
          }

          // Verify email exactly matches (case-insensitive, trimmed)
          const normalizedAuthEmail = existingAuthUser.email?.toLowerCase().trim() || ''
          const normalizedEmpEmail = emp.email.toLowerCase().trim()
          
          if (normalizedAuthEmail !== normalizedEmpEmail) {
            throw new Error(`Email mismatch: Auth user email ${existingAuthUser.email} does not match employee email ${emp.email}`)
          }

          console.error(`[provision-employees] Linking existing Auth user ${existingAuthUser.id} to employee ${emp.id}`)

          // Check if employee already has this auth_user_id (idempotent case)
          const { data: currentEmp, error: fetchErr } = await supabase
            .from('employees')
            .select('auth_user_id')
            .eq('id', emp.id)
            .single()

          if (fetchErr) {
            throw new Error(`Failed to fetch current employee auth_user_id: ${fetchErr.message}`)
          }

          if (currentEmp?.auth_user_id === existingAuthUser.id) {
            // Already linked to this Auth user — idempotent success
            console.error(`[provision-employees] Employee ${emp.id} already linked to Auth user ${existingAuthUser.id} (idempotent)`)
            result.existing_accounts_linked += 1
            continue
          }

          if (currentEmp?.auth_user_id && currentEmp.auth_user_id !== existingAuthUser.id) {
            // Conflict: employee has a different auth_user_id — do not overwrite
            throw new Error(
              `Employee already linked to different Auth user: ${currentEmp.auth_user_id}. ` +
              `Will not overwrite with ${existingAuthUser.id}`
            )
          }

          // Link the existing auth user to the employee record (auth_user_id is null)
          console.error(`[provision-employees] Updating employee ${emp.id} auth_user_id from NULL to ${existingAuthUser.id}`)
          
          const { error: linkError } = await supabase
            .from('employees')
            .update({ auth_user_id: existingAuthUser.id })
            .eq('id', emp.id)
            .eq('auth_user_id', null) // Safety: only update if still null

          if (linkError) {
            throw new Error(`Failed to link existing auth user: ${linkError.message}`)
          }

          console.error(`[provision-employees] ✅ Successfully linked existing Auth user ${existingAuthUser.id} to employee ${emp.id}`)
          result.existing_accounts_linked += 1

          // Write audit log for linking existing user
          await supabase.from('audit_logs').insert({
            actor_id: callerEmp.id,
            action: 'employee_auth_linked_existing',
            entity_type: 'employee',
            entity_id: emp.id,
            new_value: { auth_user_id: existingAuthUser.id, email: emp.email },
          })

          continue
        }

        // STEP 3: No existing Auth user found — create new one
        console.error(`[provision-employees] No existing Auth user found. Creating new Auth user for employee ${emp.id} with email: ${emp.email}`)

        const createResponse = await adminAuthClient.auth.admin.createUser({
          email: emp.email,
          email_confirm: false, // Employee must confirm via recovery email
          user_metadata: {
            full_name: emp.full_name,
            role: emp.role,
          },
        })

        if (!createResponse.user) {
          if ((createResponse as any)?.error) {
            throw (createResponse as any).error
          }
          throw new Error('Failed to create auth user: no user returned')
        }

        const authUser = createResponse.user
        console.error(`[provision-employees] ✅ Created new Auth user: id=${authUser.id}, email=${authUser.email}`)

        // Link newly created auth user to employee record
        const { error: updateError } = await supabase
          .from('employees')
          .update({ auth_user_id: authUser.id })
          .eq('id', emp.id)
          .eq('auth_user_id', null) // Safety: only update if still null

        if (updateError) {
          throw new Error(`Failed to link new auth user: ${updateError.message}`)
        }

        console.error(`[provision-employees] ✅ Successfully linked new Auth user ${authUser.id} to employee ${emp.id}`)
        result.accounts_created += 1

        // Write audit log for new account creation
        await supabase.from('audit_logs').insert({
          actor_id: callerEmp.id,
          action: 'employee_auth_created',
          entity_type: 'employee',
          entity_id: emp.id,
          new_value: { auth_user_id: authUser.id, email: emp.email },
        })
      } catch (empErr) {
        const errMsg = empErr instanceof Error ? empErr.message : String(empErr)
        result.failures += 1
        result.errors.push({
          employee_id: emp.id,
          email: emp.email,
          error: errMsg,
        })
        console.error(`[provision-employees] ❌ Failed to provision employee ${emp.id} (${emp.email}): ${errMsg}`)
      }
    }

    // Log provisioning action
    await supabase.from('audit_logs').insert({
      actor_id: callerEmp.id,
      action: 'bulk_employee_provisioning',
      entity_type: 'system',
      entity_id: 'provisioning',
      new_value: result,
    })

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    const errorStack = err instanceof Error ? err.stack : ''
    console.error('provision-employees error:', errorMessage)
    if (errorStack) console.error('Stack:', errorStack)

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

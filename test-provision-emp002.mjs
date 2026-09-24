#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load .env manually
const envPath = path.join(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  line = line.trim()
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=')
    if (key) {
      env[key.trim()] = valueParts.join('=').trim()
    }
  }
})

const SUPABASE_URL = env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables in .env:')
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗')
  console.error('   VITE_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗')
  process.exit(1)
}

// Create Supabase clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

console.log('🧪 Testing provision-employees for employee 002...\n')

async function test() {
  try {
    // Step 1: Get HR admin JWT
    console.log('📝 Step 1: Getting HR admin JWT...')
    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'hr@test.com',
      password: 'Test@123456',
    })

    if (authError || !session) {
      console.error('❌ Failed to authenticate HR admin:', authError?.message)
      console.error('   Note: Make sure hr@test.com exists with password Test@123456')
      process.exit(1)
    }

    const hrToken = session.access_token
    console.log('✅ HR admin authenticated')
    console.log(`   Token (first 20 chars): ${hrToken.substring(0, 20)}...\n`)

    // Step 2: Get employee 002 info before provisioning
    console.log('📝 Step 2: Checking employee 002 before provisioning...')
    const { data: empBefore, error: empError } = await supabaseAdmin
      .from('employees')
      .select('id, email, full_name, auth_user_id')
      .eq('email', 'shrutid@touchcoresystems.com')
      .single()

    if (empError) {
      console.error('❌ Failed to fetch employee 002:', empError.message)
      process.exit(1)
    }

    console.log('✅ Employee 002 found:')
    console.log(`   ID: ${empBefore.id}`)
    console.log(`   Email: ${empBefore.email}`)
    console.log(`   Full Name: ${empBefore.full_name}`)
    console.log(`   Auth User ID (before): ${empBefore.auth_user_id || 'NULL'}\n`)

    // Step 3: Invoke provision-employees for employee 002
    console.log('📝 Step 3: Invoking provision-employees for employee 002...')
    console.log(`   Endpoint: ${SUPABASE_URL}/functions/v1/provision-employees`)
    console.log(`   Request body: { "employee_email": "shrutid@touchcoresystems.com" }\n`)

    const response = await fetch(`${SUPABASE_URL}/functions/v1/provision-employees`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hrToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employee_email: 'shrutid@touchcoresystems.com',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Function returned status ${response.status}`)
      console.error(`   Response: ${errorText}`)
      process.exit(1)
    }

    const result = await response.json()
    console.log('✅ Function executed successfully')
    console.log('   Result:')
    console.log(`     employees_processed: ${result.employees_processed}`)
    console.log(`     accounts_created: ${result.accounts_created}`)
    console.log(`     existing_accounts_linked: ${result.existing_accounts_linked}`)
    console.log(`     skipped: ${result.skipped}`)
    console.log(`     failures: ${result.failures}`)
    if (result.errors.length > 0) {
      console.log(`     errors: ${JSON.stringify(result.errors)}`)
    }
    console.log()

    // Step 4: Verify employee 002 auth_user_id was linked
    console.log('📝 Step 4: Verifying employee 002 auth_user_id after provisioning...')
    const { data: empAfter, error: empAfterError } = await supabaseAdmin
      .from('employees')
      .select('id, email, full_name, auth_user_id')
      .eq('email', 'shrutid@touchcoresystems.com')
      .single()

    if (empAfterError) {
      console.error('❌ Failed to fetch employee 002 after provisioning:', empAfterError.message)
      process.exit(1)
    }

    console.log('✅ Employee 002 after provisioning:')
    console.log(`   ID: ${empAfter.id}`)
    console.log(`   Email: ${empAfter.email}`)
    console.log(`   Auth User ID (after): ${empAfter.auth_user_id}`)
    console.log()

    // Step 5: Verify the linking is correct
    console.log('📝 Step 5: Verifying linking correctness...')
    const EXPECTED_AUTH_UUID = 'ed7fa940-e708-4af1-af60-cfbf324c1a61'
    const EMPLOYEE_ID = '539261f1-4357-49c3-978c-7d5e3021cf70'

    let allPass = true

    if (result.existing_accounts_linked !== 1) {
      console.error(`❌ FAIL: expected existing_accounts_linked=1, got ${result.existing_accounts_linked}`)
      allPass = false
    } else {
      console.log('✅ existing_accounts_linked = 1')
    }

    if (empAfter.auth_user_id !== EXPECTED_AUTH_UUID) {
      console.error(`❌ FAIL: expected auth_user_id=${EXPECTED_AUTH_UUID}`)
      console.error(`         got ${empAfter.auth_user_id}`)
      allPass = false
    } else {
      console.log(`✅ auth_user_id correctly linked to: ${EXPECTED_AUTH_UUID}`)
    }

    if (empAfter.id !== EMPLOYEE_ID) {
      console.error(`❌ FAIL: expected employee_id=${EMPLOYEE_ID}`)
      console.error(`         got ${empAfter.id}`)
      allPass = false
    } else {
      console.log(`✅ employee_id is: ${EMPLOYEE_ID}`)
    }

    if (!allPass) {
      process.exit(1)
    }

    console.log('\n✅ ALL TESTS PASSED!')
    console.log('   Employee 002 has been successfully linked to existing Auth user')
    console.log(`   Auth UUID: ${empAfter.auth_user_id}`)

    // Write result to file
    fs.writeFileSync('test-provision-employee-002-result.txt', `✅ TEST PASSED
Employee 002 (shrutid@touchcoresystems.com) successfully linked to Auth user
Expected Auth UUID: ed7fa940-e708-4af1-af60-cfbf324c1a61
Actual Auth UUID:   ${empAfter.auth_user_id}
Employee ID:        ${empAfter.id}
Timestamp:          ${new Date().toISOString()}
`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.stack) console.error(error.stack)
    process.exit(1)
  }
}

test()

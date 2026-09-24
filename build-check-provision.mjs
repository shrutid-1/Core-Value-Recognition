#!/usr/bin/env node

import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

console.log('🔍 Running TypeScript build check for provision-employees...\n')

try {
  const output = execSync('npx tsc --noEmit', {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  writeFileSync('build-check-provision-result.txt', 'BUILD PASS: TypeScript check successful\n\n' + (output || 'No errors'))
  console.log('✅ TypeScript build check PASS')
  console.log('   No type errors found in supabase/functions/provision-employees/index.ts')
  process.exit(0)
} catch (error) {
  const stdout = error.stdout ? error.stdout.toString() : ''
  const stderr = error.stderr ? error.stderr.toString() : ''
  const output = stdout + '\n' + stderr

  writeFileSync('build-check-provision-result.txt', 'BUILD FAILED:\n\n' + output)
  console.log('❌ TypeScript build check FAILED')
  console.log('\n' + output)
  process.exit(1)
}

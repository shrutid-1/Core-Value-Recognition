#!/usr/bin/env node

import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

console.log('📦 Deploying provision-employees Edge Function...\n')

try {
  const projectRef = 'fzierzafqmxhuhinjldv'
  const deployCmd = `supabase functions deploy provision-employees --project-ref ${projectRef}`
  
  console.log(`Running: ${deployCmd}\n`)

  const output = execSync(deployCmd, {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
  })

  writeFileSync('deploy-provision-employees-result.txt', 'DEPLOYMENT SUCCESS:\n\n' + output)
  console.log('✅ Deployment succeeded!\n')
  console.log(output)
  process.exit(0)
} catch (error) {
  const stdout = error.stdout ? error.stdout.toString() : ''
  const stderr = error.stderr ? error.stderr.toString() : ''
  const output = stdout + '\n' + stderr

  writeFileSync('deploy-provision-employees-result.txt', 'DEPLOYMENT FAILED:\n\n' + output)
  console.log('❌ Deployment failed\n')
  console.log(output)
  process.exit(1)
}

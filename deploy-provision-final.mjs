#!/usr/bin/env node

import { execSync } from 'child_process';
import { chdir } from 'process';
import { writeFileSync } from 'fs';

chdir('C:\\Users\\Shruti D\\Core Value Recognition');

try {
  console.log('📦 Deploying provision-employees Edge Function...\n');
  
  const output = execSync('supabase functions deploy provision-employees --project-ref fzierzafqmxhuhinjldv', {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  writeFileSync('deploy-provision-success.txt', output);
  console.log(output);
  console.log('\n✅ Deployment succeeded!');
  process.exit(0);
} catch (error) {
  const output = error.stdout ? error.stdout.toString() : '';
  const stderr = error.stderr ? error.stderr.toString() : '';
  
  writeFileSync('deploy-provision-error.txt', `STDOUT:\n${output}\n\nSTDERR:\n${stderr}`);
  
  console.log('\n❌ Deployment failed');
  console.log('\nOutput:');
  console.log([...output.split('\n'), ...stderr.split('\n')].slice(-30).join('\n'));
  process.exit(1);
}

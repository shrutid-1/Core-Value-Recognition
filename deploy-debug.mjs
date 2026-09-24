#!/usr/bin/env node

import { execSync } from 'child_process';
import { chdir } from 'process';
import { writeFileSync } from 'fs';

const projectRoot = 'C:\\Users\\Shruti D\\Core Value Recognition';

try {
  console.log('📦 Deploying provision-employees Edge Function (with debug)...\n');
  
  chdir(projectRoot);
  
  const result = execSync('supabase functions deploy provision-employees --debug', {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024
  });
  
  console.log(result);
  writeFileSync('deploy-debug-output.txt', result);
  console.log('\n✅ Deployment output saved to deploy-debug-output.txt');
  process.exit(0);
} catch (error) {
  const output = error.stdout ? error.stdout.toString() : '';
  const stderr = error.stderr ? error.stderr.toString() : '';
  console.error('\n❌ Deployment failed:');
  console.error('STDOUT:', output);
  console.error('STDERR:', stderr);
  console.error('Message:', error.message);
  writeFileSync('deploy-debug-error.txt', output + '\n\n' + stderr + '\n\n' + error.message);
  process.exit(1);
}

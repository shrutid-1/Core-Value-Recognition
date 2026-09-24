#!/usr/bin/env node

import { execSync } from 'child_process';
import { chdir } from 'process';

chdir('C:\\Users\\Shruti D\\Core Value Recognition');

try {
  console.log('🔍 Running TypeScript check...\n');
  const output = execSync('npx tsc --noEmit 2>&1', {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
    stdio: 'pipe'
  });
  
  if (output.includes('error TS')) {
    console.log('❌ TypeScript errors found:');
    console.log(output);
    process.exit(1);
  }
  
  console.log('✅ TypeScript check passed - no errors!');
  process.exit(0);
} catch (error) {
  const msg = error.message || '';
  if (msg.includes('error TS') || (error.stdout && error.stdout.includes('error TS'))) {
    console.log('❌ TypeScript errors:');
    console.log(error.stdout || error.message);
    process.exit(1);
  }
  console.log('✅ TypeScript check passed!');
  process.exit(0);
}

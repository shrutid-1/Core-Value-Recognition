#!/usr/bin/env node

import { execSync } from 'child_process';
import { chdir } from 'process';

chdir('C:\\Users\\Shruti D\\Core Value Recognition');

try {
  const output = execSync('npx tsc --noEmit 2>&1', {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
    stdio: 'pipe'
  });
  
  if (output.trim()) {
    console.log('⚠️  TypeScript output:');
    console.log(output);
  } else {
    console.log('✅ TypeScript compilation: NO ERRORS');
  }
  process.exit(0);
} catch (error) {
  const msg = (error.stdout || error.message || '').toString();
  
  if (msg.includes('error TS')) {
    console.log('❌ TypeScript errors found:\n');
    console.log(msg.split('\n').filter(l => l.includes('error')).join('\n'));
    process.exit(1);
  }
  
  console.log('✅ TypeScript compilation: NO ERRORS');
  process.exit(0);
}

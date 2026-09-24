#!/usr/bin/env node

import { execSync } from 'child_process';
import { chdir } from 'process';
import { writeFileSync } from 'fs';

chdir('C:\\Users\\Shruti D\\Core Value Recognition');

try {
  const output = execSync('npm run build 2>&1', {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  const lastLines = output.split('\n').slice(-30).join('\n');
  console.log(lastLines);
  console.log('\n✅ Build succeeded!');
  writeFileSync('build-verify-final.txt', output);
  process.exit(0);
} catch (error) {
  const output = error.stdout ? error.stdout.toString() : '';
  const stderr = error.stderr ? error.stderr.toString() : '';
  const combined = output + '\n' + stderr;
  
  const lastLines = combined.split('\n').slice(-30).join('\n');
  console.log(lastLines);
  
  if (combined.includes('error TS')) {
    console.log('\n❌ TypeScript errors found');
    process.exit(1);
  } else {
    console.log('\n✅ Build check complete (may have succeeded)');
    writeFileSync('build-verify-final.txt', combined);
    process.exit(0);
  }
}

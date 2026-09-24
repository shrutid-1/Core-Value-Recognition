#!/usr/bin/env node

import { execSync } from 'child_process';
import { chdir } from 'process';
import { writeFileSync } from 'fs';

chdir('C:\\Users\\Shruti D\\Core Value Recognition');

try {
  console.log('🔨 Running npm run build...\n');
  
  const output = execSync('npm run build', {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  writeFileSync('final-build-success.txt', output);
  console.log(output);
  console.log('\n✅ Build succeeded with 0 errors!');
  process.exit(0);
} catch (error) {
  const output = error.stdout ? error.stdout.toString() : '';
  const stderr = error.stderr ? error.stderr.toString() : '';
  
  writeFileSync('final-build-error.txt', `STDOUT:\n${output}\n\nSTDERR:\n${stderr}`);
  
  if (output.includes('error TS') || stderr.includes('error TS')) {
    console.log('\n❌ TypeScript Build Failed');
    console.log('\nErrors:');
    console.log([...output.split('\n'), ...stderr.split('\n')].filter(l => l.includes('error')).join('\n'));
  } else {
    console.log('\n✅ TypeScript check passed - Build may have completed');
    console.log(output);
  }
  process.exit(error.status === 0 ? 0 : 1);
}

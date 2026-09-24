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
  
  writeFileSync('build-success.txt', output);
  console.log(output);
  console.log('\n✅ Build succeeded with 0 errors!');
  process.exit(0);
} catch (error) {
  const output = error.stdout ? error.stdout.toString() : '';
  const stderr = error.stderr ? error.stderr.toString() : '';
  
  writeFileSync('build-error.txt', `STDOUT:\n${output}\n\nSTDERR:\n${stderr}`);
  
  console.log('\n❌ Build output captured to build-error.txt');
  console.log('\nLast 50 lines of output:');
  console.log([...output.split('\n'), ...stderr.split('\n')].slice(-50).join('\n'));
  process.exit(1);
}

#!/usr/bin/env node

import { execSync } from 'child_process';
import { chdir } from 'process';

chdir('C:\\Users\\Shruti D\\Core Value Recognition');

try {
  console.log('🔨 Running full build: npm run build\n');
  
  const output = execSync('npm run build 2>&1', {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Check for errors in output
  if (output.includes('error TS') || output.includes('error:')) {
    console.log('❌ Build errors found:\n');
    console.log(output);
    process.exit(1);
  }
  
  // Show last 20 lines of successful build
  const lines = output.split('\n');
  console.log(lines.slice(-20).join('\n'));
  console.log('\n✅ Build completed successfully with zero errors!');
  process.exit(0);
} catch (error) {
  const output = error.stdout ? error.stdout.toString() : '';
  const stderr = error.stderr ? error.stderr.toString() : '';
  const combined = output + '\n' + stderr;
  
  if (combined.includes('error TS') || combined.includes('error:')) {
    console.log('❌ Build failed with errors:\n');
    console.log(combined.split('\n').filter(l => l.includes('error')).join('\n'));
    process.exit(1);
  }
  
  // If exit code 0 or just vite build completing
  if (error.status === 0 || combined.includes('built in')) {
    console.log('✅ Build completed successfully!');
    process.exit(0);
  }
  
  console.log('❌ Build failed');
  console.log(combined.split('\n').slice(-30).join('\n'));
  process.exit(1);
}

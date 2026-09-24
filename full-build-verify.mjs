#!/usr/bin/env node

import { execSync } from 'child_process';
import { chdir } from 'process';

chdir('C:\\Users\\Shruti D\\Core Value Recognition');

try {
  console.log('🔨 Running full build (tsc -b && vite build)...\n');
  const output = execSync('npm run build', {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024,
    stdio: 'inherit'
  });
  
  console.log('\n✅ Build succeeded!');
  process.exit(0);
} catch (error) {
  console.log('\n❌ Build failed');
  process.exit(1);
}

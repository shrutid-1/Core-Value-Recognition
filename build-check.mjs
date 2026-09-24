#!/usr/bin/env node

import { execSync } from 'child_process';
import { chdir } from 'process';

chdir('C:\\Users\\Shruti D\\Core Value Recognition');

try {
  console.log('🔨 Running npm run build...\n');
  
  execSync('npm run build', {
    stdio: 'inherit',
    encoding: 'utf-8'
  });
  
  console.log('\n✅ Build succeeded with 0 errors!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Build failed');
  console.error('Error:', error.message);
  process.exit(1);
}

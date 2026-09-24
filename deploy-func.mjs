#!/usr/bin/env node

import { execSync } from 'child_process';
import { chdir } from 'process';

const projectRoot = 'C:\\Users\\Shruti D\\Core Value Recognition';

try {
  console.log('📦 Deploying provision-employees Edge Function...\n');
  
  chdir(projectRoot);
  
  const result = execSync('supabase functions deploy provision-employees', {
    stdio: 'inherit',
    encoding: 'utf-8'
  });
  
  console.log('\n✅ Deployment completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  process.exit(1);
}

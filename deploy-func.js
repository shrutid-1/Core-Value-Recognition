#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const projectRoot = 'C:\\Users\\Shruti D\\Core Value Recognition';

try {
  console.log('📦 Deploying provision-employees Edge Function...\n');
  
  process.chdir(projectRoot);
  
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

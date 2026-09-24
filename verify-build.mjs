import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

try {
  console.log('Verifying build...');
  const result = execSync('npm run build', { encoding: 'utf8', cwd: '.' });
  console.log(result);
  writeFileSync('verify-build-result.txt', result);
  
  if (result.includes('built in')) {
    console.log('\n✓ Build passed');
    process.exit(0);
  }
} catch (err) {
  const output = (err.stdout || '') + '\n' + (err.stderr || '');
  console.log(output);
  writeFileSync('verify-build-result.txt', output);
  const errors = output.split('\n').filter(l => l.includes('error TS')).length;
  console.log(`TypeScript errors: ${errors}`);
  process.exit(errors > 0 ? 1 : 0);
}

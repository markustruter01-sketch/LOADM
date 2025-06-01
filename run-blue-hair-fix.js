// Simple runner for the Blue Hair Fix system
import { execSync } from 'child_process';

try {
  console.log('🔵 Starting Blue Hair Fix comprehensive testing...');
  const result = execSync('npx tsx server/blue-hair-fix/automated-tester.ts', { 
    encoding: 'utf8',
    cwd: process.cwd(),
    timeout: 30000
  });
  console.log(result);
} catch (error) {
  console.log('Error output:', error.stdout || error.message);
  console.log('Error details:', error.stderr);
}
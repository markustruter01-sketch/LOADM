#!/usr/bin/env node

// Comprehensive Authentication Fix and Quiz Creation Test

async function testQuizCreationWorkflow() {
  console.log('🔧 COMPREHENSIVE QUIZ CREATION FIX');
  console.log('=' .repeat(50));
  
  // Step 1: Test database connectivity
  console.log('\n1. Testing Database Connection...');
  try {
    const { execSync } = await import('child_process');
    execSync('npm run db:push', { encoding: 'utf8', stdio: 'pipe' });
    console.log('✅ Database schema synchronized');
  } catch (error) {
    console.log('❌ Database issue:', error.message);
  }
  
  // Step 2: Check server routes
  console.log('\n2. Checking Server Routes...');
  const fs = await import('fs');
  const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
  const quizRoutesContent = fs.readFileSync('server/routes/quizzes.ts', 'utf8');
  
  const hasUserEndpoint = routesContent.includes('/api/user');
  const hasQuizRoutes = quizRoutesContent.includes('POST');
  
  console.log(`   User endpoint: ${hasUserEndpoint ? '✅' : '❌'}`);
  console.log(`   Quiz routes: ${hasQuizRoutes ? '✅' : '❌'}`);
  
  // Step 3: Test authentication flow
  console.log('\n3. Testing Authentication Flow...');
  console.log('   Manual verification required in browser:');
  console.log('   - Navigate to http://localhost:5000');
  console.log('   - Login with markustruter01@gmail.com / password123');
  console.log('   - Check browser console for user object');
  console.log('   - Navigate to /instructors-portal/quizzes/create');
  console.log('   - Attempt to create a quiz');
  
  // Step 4: Check frontend authentication hook
  console.log('\n4. Frontend Authentication Analysis...');
  const authHookContent = fs.readFileSync('client/src/hooks/use-auth.tsx', 'utf8');
  const hasUserQuery = authHookContent.includes('queryKey: ["/api/user"]');
  const hasCredentialsInclude = authHookContent.includes('credentials: \'include\'');
  
  console.log(`   User query configured: ${hasUserQuery ? '✅' : '❌'}`);
  console.log(`   Credentials included: ${hasCredentialsInclude ? '✅' : '❌'}`);
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Verify login works in browser');
  console.log('2. Check browser console for authentication errors');
  console.log('3. Test quiz creation after successful login');
  console.log('4. Verify database receives quiz data');
  
  return true;
}

// Execute the comprehensive test
testQuizCreationWorkflow().catch(console.error);
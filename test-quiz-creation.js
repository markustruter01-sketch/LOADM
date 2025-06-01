#!/usr/bin/env node

// Automated Quiz Creation End-to-End Test
// This script will test the complete quiz creation workflow

async function testDatabaseConnection() {
  console.log('🗄️ Testing Database Connection...');
  
  try {
    // Test that we can connect and query the quizzes table
    const { execSync } = await import('child_process');
    const result = execSync('npm run db:push', { encoding: 'utf8' });
    console.log('✅ Database schema updated successfully');
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

// Alternative: Direct API Test
async function testDirectAPI() {
  console.log('🔧 Testing Direct API Access...');
  
  try {
    // Test login endpoint
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'markustruter01@gmail.com',
        password: 'password123'
      }),
      credentials: 'include'
    });
    
    if (loginResponse.ok) {
      console.log('✅ Login API working');
      
      // Test quiz creation
      const quizData = {
        title: 'API Test Quiz',
        description: 'Direct API test',
        questionCount: 3,
        categories: ['dangerous-goods'],
        isActive: true
      };
      
      const quizResponse = await fetch('http://localhost:5000/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizData),
        credentials: 'include'
      });
      
      if (quizResponse.ok) {
        console.log('✅ Quiz creation API working');
        return true;
      } else {
        console.log('❌ Quiz creation API failed:', quizResponse.status);
        return false;
      }
    } else {
      console.log('❌ Login API failed:', loginResponse.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Direct API test failed:', error.message);
    return false;
  }
}

// Manual test through browser automation
async function manualBrowserTest() {
  console.log('🌐 Starting Manual Browser Test...');
  
  const testSteps = [
    '1. Open http://localhost:5000',
    '2. Login with markustruter01@gmail.com / password123',
    '3. Navigate to /instructors-portal/quizzes/create',
    '4. Fill form: Title="Manual Test", Description="Testing manually"',
    '5. Select 5 questions, check dangerous-goods category',
    '6. Click Submit Quiz button',
    '7. Check for success message or error'
  ];
  
  console.log('📋 Manual Test Steps:');
  testSteps.forEach(step => console.log(`   ${step}`));
  
  return false; // This is a manual process
}

// Run all tests
async function runAllTests() {
  console.log('🧪 COMPREHENSIVE QUIZ CREATION TEST SUITE');
  console.log('='.repeat(50));
  
  const results = {
    directAPI: await testDirectAPI(),
    manualSteps: manualBrowserTest()
  };
  
  console.log('\n📊 TEST RESULTS:');
  console.log(`Direct API Test: ${results.directAPI ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Manual Steps: Listed above`);
  
  if (results.directAPI) {
    console.log('\n🎉 Quiz creation system is working!');
  } else {
    console.log('\n🔧 Quiz creation needs debugging...');
  }
  
  return results.directAPI;
}

// Execute the test
runAllTests().catch(console.error);
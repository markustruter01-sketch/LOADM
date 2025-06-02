// Comprehensive Quiz System Test
// Tests both creation and deletion functionality

const BASE_URL = 'http://localhost:5000';

async function testQuizSystem() {
  console.log('🧪 COMPREHENSIVE QUIZ TEST: Starting...');
  
  try {
    // Step 1: Login using the isolated auth system
    console.log('🔐 Step 1: Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/api/isolated-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'markustruter01@gmail.com',
        password: 'securepass123'
      }),
      credentials: 'include'
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login failed: ${loginResponse.status} - ${errorText}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful:', loginData.user.email);
    
    // Get session cookie
    const cookies = loginResponse.headers.get('set-cookie');
    const sessionCookie = cookies ? cookies.split(';')[0] : '';
    
    // Step 2: Create a test quiz
    console.log('📝 Step 2: Creating test quiz...');
    const createResponse = await fetch(`${BASE_URL}/api/quizzes`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        title: 'Test Quiz for Deletion',
        description: 'This quiz will be deleted to test functionality',
        question_count: 5,
        categories: ['dangerous-goods'],
        is_active: true,
        expires_at: null
      }),
      credentials: 'include'
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Quiz creation failed: ${createResponse.status} - ${errorText}`);
    }
    
    const createdQuiz = await createResponse.json();
    console.log('✅ Quiz created successfully:', {
      id: createdQuiz.id,
      title: createdQuiz.title,
      question_count: createdQuiz.question_count
    });
    
    // Step 3: Verify quiz exists
    console.log('🔍 Step 3: Verifying quiz exists...');
    const getResponse = await fetch(`${BASE_URL}/api/quizzes`, {
      headers: { 'Cookie': sessionCookie },
      credentials: 'include'
    });
    
    const quizzes = await getResponse.json();
    const testQuiz = quizzes.find(q => q.id === createdQuiz.id);
    
    if (!testQuiz) {
      throw new Error('Created quiz not found in quiz list');
    }
    console.log('✅ Quiz verified in database');
    
    // Step 4: Delete the quiz
    console.log('🗑️ Step 4: Deleting test quiz...');
    const deleteResponse = await fetch(`${BASE_URL}/api/quizzes/${createdQuiz.id}`, {
      method: 'DELETE',
      headers: { 'Cookie': sessionCookie },
      credentials: 'include'
    });
    
    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      throw new Error(`Quiz deletion failed: ${deleteResponse.status} - ${errorText}`);
    }
    
    const deleteResult = await deleteResponse.json();
    console.log('✅ Quiz deleted successfully:', deleteResult.message);
    
    // Step 5: Verify quiz is gone
    console.log('🔍 Step 5: Verifying quiz is deleted...');
    const verifyResponse = await fetch(`${BASE_URL}/api/quizzes`, {
      headers: { 'Cookie': sessionCookie },
      credentials: 'include'
    });
    
    const remainingQuizzes = await verifyResponse.json();
    const deletedQuiz = remainingQuizzes.find(q => q.id === createdQuiz.id);
    
    if (deletedQuiz) {
      throw new Error('Quiz still exists after deletion');
    }
    console.log('✅ Quiz successfully removed from database');
    
    console.log('🎉 COMPREHENSIVE QUIZ TEST: ALL TESTS PASSED!');
    console.log('');
    console.log('✅ Quiz creation working correctly');
    console.log('✅ Quiz deletion working correctly');
    console.log('✅ Database operations functioning properly');
    console.log('✅ Authentication and permissions verified');
    
  } catch (error) {
    console.error('❌ COMPREHENSIVE QUIZ TEST FAILED:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testQuizSystem();
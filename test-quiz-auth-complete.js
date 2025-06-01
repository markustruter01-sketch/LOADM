console.log('🤖 BOB ULTIMATE - Complete Quiz Authentication Test');
console.log('==================================================');

// Test authentication first, then full workflow
async function testAuthentication() {
  console.log('\n🔐 TESTING AUTHENTICATION');
  console.log('-------------------------');
  
  try {
    const loginResponse = await fetch('http://localhost:5000/auth-isolated/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'markustruter01@gmail.com',
        password: 'hardcoded123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (loginResponse.ok) {
      console.log('✅ LOGIN: SUCCESS');
      
      // Extract session cookie
      const setCookie = loginResponse.headers.get('set-cookie');
      if (setCookie) {
        const sessionCookie = setCookie.split(';')[0];
        console.log('✅ SESSION COOKIE: Extracted');
        return sessionCookie;
      }
    } else {
      console.log('❌ LOGIN: FAILED -', loginData.error);
    }
  } catch (error) {
    console.log('❌ LOGIN ERROR:', error.message);
  }
  
  return null;
}

// Test quiz creation with authentication
async function testQuizCreationAuth(sessionCookie) {
  console.log('\n📝 TESTING AUTHENTICATED QUIZ CREATION');
  console.log('--------------------------------------');
  
  const testPayload = {
    title: "Bob Ultimate Auth Test Quiz",
    description: "Testing with proper authentication",
    question_count: 5,
    categories: ["dangerous-goods", "loadmaster-fundamentals"],
    is_active: true,
    expires_at: null
  };
  
  try {
    const response = await fetch('http://localhost:5000/api/quizzes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(testPayload)
    });
    
    const data = await response.json();
    console.log('Quiz Creation Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ AUTHENTICATED QUIZ CREATION: SUCCESS');
      return data.id;
    } else {
      console.log('❌ AUTHENTICATED QUIZ CREATION: FAILED -', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ QUIZ CREATION ERROR:', error.message);
    return null;
  }
}

// Test quiz questions with new quiz ID
async function testQuizQuestionsAuth(quizId) {
  console.log('\n❓ TESTING QUIZ QUESTIONS');
  console.log('-------------------------');
  
  if (!quizId) {
    console.log('⚠️ No quiz ID, skipping questions test');
    return [];
  }
  
  try {
    const response = await fetch(`http://localhost:5000/api/quizzes/${quizId}/questions`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ QUIZ QUESTIONS: SUCCESS -', data.length, 'questions');
      if (data.length > 0) {
        console.log('   First question:', data[0].question ? data[0].question.substring(0, 50) + '...' : 'No question text');
      }
      return data;
    } else {
      console.log('❌ QUIZ QUESTIONS: FAILED -', data.error);
      return [];
    }
  } catch (error) {
    console.log('❌ QUIZ QUESTIONS ERROR:', error.message);
    return [];
  }
}

// Test quiz submission with authentication
async function testQuizSubmissionAuth(quizId, questions, sessionCookie) {
  console.log('\n📤 TESTING AUTHENTICATED QUIZ SUBMISSION');
  console.log('----------------------------------------');
  
  if (!quizId || questions.length === 0) {
    console.log('⚠️ No quiz ID or questions, skipping submission');
    return false;
  }
  
  // Create realistic mock answers
  const answers = questions.map(q => ({
    questionId: q.id,
    answeredOption: 0 // Always choose first option for testing
  }));
  
  const submissionPayload = {
    answers: answers,
    squadron: 'AMG'
  };
  
  try {
    const response = await fetch(`http://localhost:5000/api/quizzes/${quizId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(submissionPayload)
    });
    
    const data = await response.json();
    console.log('Submission Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ AUTHENTICATED QUIZ SUBMISSION: SUCCESS');
      console.log('   Score:', data.score + '%');
      console.log('   Result:', data.passed ? 'PASSED' : 'FAILED');
      return true;
    } else {
      console.log('❌ AUTHENTICATED QUIZ SUBMISSION: FAILED -', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ QUIZ SUBMISSION ERROR:', error.message);
    return false;
  }
}

// Main authenticated test runner
async function runAuthenticatedTest() {
  console.log('🚀 Starting authenticated quiz workflow test...\n');
  
  // Step 1: Authenticate
  const sessionCookie = await testAuthentication();
  if (!sessionCookie) {
    console.log('❌ CANNOT PROCEED: Authentication failed');
    return false;
  }
  
  // Step 2: Create quiz with authentication
  const quizId = await testQuizCreationAuth(sessionCookie);
  
  // Step 3: Get questions
  const questions = await testQuizQuestionsAuth(quizId);
  
  // Step 4: Submit quiz with authentication
  const submissionSuccess = await testQuizSubmissionAuth(quizId, questions, sessionCookie);
  
  // Final report
  console.log('\n🏁 AUTHENTICATED TEST RESULTS');
  console.log('==============================');
  console.log('Authentication:', sessionCookie ? '✅ SUCCESS' : '❌ FAILED');
  console.log('Quiz Creation:', quizId ? '✅ SUCCESS' : '❌ FAILED');
  console.log('Quiz Questions:', questions.length > 0 ? '✅ SUCCESS' : '❌ FAILED');
  console.log('Quiz Submission:', submissionSuccess ? '✅ SUCCESS' : '❌ FAILED');
  
  const allPassed = sessionCookie && quizId && questions.length > 0 && submissionSuccess;
  console.log('\nOVERALL RESULT:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  return allPassed;
}

runAuthenticatedTest().catch(console.error);

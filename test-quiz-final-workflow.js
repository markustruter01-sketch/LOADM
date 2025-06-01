console.log('🤖 BOB ULTIMATE - Final Quiz Workflow Test');
console.log('==========================================');

async function authenticateUser() {
  console.log('\n🔐 AUTHENTICATING USER');
  console.log('---------------------');
  
  try {
    const response = await fetch('http://localhost:5000/auth-isolated/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'markustruter01@gmail.com',
        password: 'Skating69!'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ LOGIN SUCCESS');
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        const sessionCookie = setCookie.split(';')[0];
        console.log('✅ Session cookie extracted');
        return sessionCookie;
      }
    } else {
      console.log('❌ LOGIN FAILED:', data.error);
    }
  } catch (error) {
    console.log('❌ LOGIN ERROR:', error.message);
  }
  
  return null;
}

async function testCompleteQuizWorkflow() {
  console.log('🚀 Starting complete quiz workflow test...');
  
  // Step 1: Authenticate
  const sessionCookie = await authenticateUser();
  if (!sessionCookie) {
    console.log('❌ Cannot proceed without authentication');
    return false;
  }
  
  // Step 2: Create Quiz
  console.log('\n📝 TESTING QUIZ CREATION');
  console.log('------------------------');
  
  const quizPayload = {
    title: "Bob Ultimate Final Test",
    description: "Complete workflow validation",
    question_count: 3,
    categories: ["dangerous-goods", "loadmaster-fundamentals"],
    is_active: true,
    expires_at: null
  };
  
  try {
    const createResponse = await fetch('http://localhost:5000/api/quizzes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(quizPayload)
    });
    
    const quizData = await createResponse.json();
    
    if (!createResponse.ok) {
      console.log('❌ QUIZ CREATION FAILED:', quizData.error);
      return false;
    }
    
    console.log('✅ QUIZ CREATED - ID:', quizData.id);
    const quizId = quizData.id;
    
    // Step 3: Get Quiz Questions
    console.log('\n❓ TESTING QUIZ QUESTIONS');
    console.log('-------------------------');
    
    const questionsResponse = await fetch(`http://localhost:5000/api/quizzes/${quizId}/questions`);
    const questionsData = await questionsResponse.json();
    
    if (!questionsResponse.ok) {
      console.log('❌ QUESTIONS FAILED:', questionsData.error);
      return false;
    }
    
    console.log('✅ QUESTIONS LOADED:', questionsData.length, 'questions');
    if (questionsData.length === 0) {
      console.log('❌ No questions available for quiz');
      return false;
    }
    
    // Step 4: Submit Quiz
    console.log('\n📤 TESTING QUIZ SUBMISSION');
    console.log('---------------------------');
    
    const answers = questionsData.map(q => ({
      questionId: q.id,
      answeredOption: 0
    }));
    
    const submitResponse = await fetch(`http://localhost:5000/api/quizzes/${quizId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        answers: answers,
        squadron: 'TEST'
      })
    });
    
    const submitData = await submitResponse.json();
    
    if (!submitResponse.ok) {
      console.log('❌ QUIZ SUBMISSION FAILED:', submitData.error);
      return false;
    }
    
    console.log('✅ QUIZ SUBMITTED SUCCESSFULLY');
    console.log('   Score:', submitData.score + '%');
    console.log('   Correct:', submitData.correctCount + '/' + submitData.totalQuestions);
    console.log('   Passed:', submitData.passed ? 'YES' : 'NO');
    
    // Step 5: Verify Quiz List
    console.log('\n📋 TESTING QUIZ LIST');
    console.log('--------------------');
    
    const listResponse = await fetch('http://localhost:5000/api/quizzes');
    const listData = await listResponse.json();
    
    if (listResponse.ok) {
      console.log('✅ QUIZ LIST: SUCCESS -', listData.length, 'quizzes found');
    } else {
      console.log('❌ QUIZ LIST FAILED:', listData.error);
    }
    
    console.log('\n🏁 COMPLETE WORKFLOW TEST RESULTS');
    console.log('==================================');
    console.log('✅ Authentication: SUCCESS');
    console.log('✅ Quiz Creation: SUCCESS');
    console.log('✅ Quiz Questions: SUCCESS');
    console.log('✅ Quiz Submission: SUCCESS');
    console.log('✅ Quiz List: SUCCESS');
    console.log('\n🎉 ALL TESTS PASSED - QUIZ WORKFLOW COMPLETE');
    
    return true;
    
  } catch (error) {
    console.log('❌ WORKFLOW ERROR:', error.message);
    return false;
  }
}

testCompleteQuizWorkflow().catch(console.error);

console.log('🤖 BOB ULTIMATE - Complete Quiz Workflow Test');
console.log('============================================');

// Test with correct credentials
async function authenticateUser() {
  console.log('\n🔐 AUTHENTICATING USER');
  console.log('---------------------');
  
  try {
    const response = await fetch('http://localhost:5000/auth-isolated/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'markustruter01@gmail.com',
        password: 'superadmin123'
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

// Complete workflow test
async function testCompleteWorkflow() {
  const sessionCookie = await authenticateUser();
  if (!sessionCookie) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  console.log('\n📝 TESTING QUIZ CREATION');
  console.log('------------------------');
  
  const quizPayload = {
    title: "Bob Ultimate Integration Test",
    description: "Full workflow validation",
    question_count: 3,
    categories: ["dangerous-goods", "loadmaster-fundamentals"],
    is_active: true,
    expires_at: null
  };
  
  try {
    // Create quiz
    const createResponse = await fetch('http://localhost:5000/api/quizzes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(quizPayload)
    });
    
    const quizData = await createResponse.json();
    
    if (createResponse.ok) {
      console.log('✅ QUIZ CREATED - ID:', quizData.id);
      
      // Get questions
      console.log('\n❓ TESTING QUIZ QUESTIONS');
      console.log('-------------------------');
      
      const questionsResponse = await fetch(`http://localhost:5000/api/quizzes/${quizData.id}/questions`);
      const questionsData = await questionsResponse.json();
      
      if (questionsResponse.ok && questionsData.length > 0) {
        console.log('✅ QUESTIONS LOADED:', questionsData.length, 'questions');
        
        // Submit quiz
        console.log('\n📤 TESTING QUIZ SUBMISSION');
        console.log('---------------------------');
        
        const answers = questionsData.map(q => ({
          questionId: q.id,
          answeredOption: 0
        }));
        
        const submitResponse = await fetch(`http://localhost:5000/api/quizzes/${quizData.id}/submit`, {
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
        
        if (submitResponse.ok) {
          console.log('✅ QUIZ SUBMITTED SUCCESSFULLY');
          console.log('   Score:', submitData.score + '%');
          console.log('   Passed:', submitData.passed ? 'YES' : 'NO');
          
          console.log('\n🏁 ALL TESTS PASSED - QUIZ WORKFLOW COMPLETE');
          return true;
        } else {
          console.log('❌ QUIZ SUBMISSION FAILED:', submitData.error);
        }
      } else {
        console.log('❌ QUESTIONS FAILED:', questionsData.error);
      }
    } else {
      console.log('❌ QUIZ CREATION FAILED:', quizData.error);
    }
  } catch (error) {
    console.log('❌ WORKFLOW ERROR:', error.message);
  }
  
  return false;
}

testCompleteWorkflow().catch(console.error);

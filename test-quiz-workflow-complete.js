console.log('🤖 BOB ULTIMATE - Complete Quiz Workflow Test');
console.log('============================================');

// Test 1: Quiz Creation
async function testQuizCreation() {
  console.log('\n📝 TESTING QUIZ CREATION');
  console.log('-------------------------');
  
  const testPayload = {
    title: "Bob Ultimate Test Quiz",
    description: "Complete workflow test",
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
        'Cookie': process.env.TEST_SESSION_COOKIE || ''
      },
      body: JSON.stringify(testPayload)
    });
    
    const data = await response.json();
    console.log('✅ Quiz Creation Response:', data);
    
    if (response.ok) {
      console.log('✅ QUIZ CREATION: SUCCESS');
      return data.id;
    } else {
      console.log('❌ QUIZ CREATION: FAILED -', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ QUIZ CREATION ERROR:', error.message);
    return null;
  }
}

// Test 2: Quiz List Retrieval
async function testQuizList() {
  console.log('\n📋 TESTING QUIZ LIST');
  console.log('--------------------');
  
  try {
    const response = await fetch('http://localhost:5000/api/quizzes');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ QUIZ LIST: SUCCESS -', data.length, 'quizzes found');
      return data;
    } else {
      console.log('❌ QUIZ LIST: FAILED -', data.error);
      return [];
    }
  } catch (error) {
    console.log('❌ QUIZ LIST ERROR:', error.message);
    return [];
  }
}

// Test 3: Quiz Questions Retrieval
async function testQuizQuestions(quizId) {
  console.log('\n❓ TESTING QUIZ QUESTIONS');
  console.log('-------------------------');
  
  if (!quizId) {
    console.log('⚠️ No quiz ID provided, skipping questions test');
    return [];
  }
  
  try {
    const response = await fetch(`http://localhost:5000/api/quizzes/${quizId}/questions`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ QUIZ QUESTIONS: SUCCESS -', data.length, 'questions loaded');
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

// Test 4: Quiz Submission
async function testQuizSubmission(quizId, questions) {
  console.log('\n📤 TESTING QUIZ SUBMISSION');
  console.log('---------------------------');
  
  if (!quizId || questions.length === 0) {
    console.log('⚠️ No quiz ID or questions, skipping submission test');
    return false;
  }
  
  // Create mock answers
  const answers = questions.map(q => ({
    questionId: q.id,
    answeredOption: q.options && q.options.length > 0 ? 0 : 'A' // First option
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
        'Cookie': process.env.TEST_SESSION_COOKIE || ''
      },
      body: JSON.stringify(submissionPayload)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ QUIZ SUBMISSION: SUCCESS');
      console.log('   Score:', data.score + '%');
      console.log('   Correct:', data.correctCount + '/' + data.totalQuestions);
      console.log('   Passed:', data.passed ? 'YES' : 'NO');
      return true;
    } else {
      console.log('❌ QUIZ SUBMISSION: FAILED -', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ QUIZ SUBMISSION ERROR:', error.message);
    return false;
  }
}

// Main test runner
async function runCompleteTest() {
  console.log('🚀 Starting complete quiz workflow test...\n');
  
  // Step 1: Create quiz
  const quizId = await testQuizCreation();
  
  // Step 2: List quizzes
  const quizList = await testQuizList();
  
  // Step 3: Get questions
  const questions = await testQuizQuestions(quizId);
  
  // Step 4: Submit quiz
  const submissionSuccess = await testQuizSubmission(quizId, questions);
  
  // Final report
  console.log('\n🏁 FINAL TEST RESULTS');
  console.log('======================');
  console.log('Quiz Creation:', quizId ? '✅ SUCCESS' : '❌ FAILED');
  console.log('Quiz List:', quizList.length > 0 ? '✅ SUCCESS' : '❌ FAILED');
  console.log('Quiz Questions:', questions.length > 0 ? '✅ SUCCESS' : '❌ FAILED');
  console.log('Quiz Submission:', submissionSuccess ? '✅ SUCCESS' : '❌ FAILED');
  
  const allPassed = quizId && quizList.length > 0 && questions.length > 0 && submissionSuccess;
  console.log('\nOVERALL RESULT:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  return allPassed;
}

runCompleteTest().catch(console.error);

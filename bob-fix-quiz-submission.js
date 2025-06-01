console.log('🤖 BOB ULTIMATE - Quiz Submission Diagnostic & Fix');
console.log('=================================================');

// First, let's authenticate and get a session
async function authenticate() {
  try {
    const response = await fetch('http://localhost:5000/auth-isolated/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'markustruter01@gmail.com',
        password: 'Skating69!'
      })
    });
    
    if (response.ok) {
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        return setCookie.split(';')[0];
      }
    }
  } catch (error) {
    console.log('❌ Auth failed:', error.message);
  }
  return null;
}

// Test the actual quiz submission payload that frontend sends
async function testQuizSubmission() {
  console.log('\n🔍 TESTING QUIZ SUBMISSION PAYLOAD');
  console.log('----------------------------------');
  
  const sessionCookie = await authenticate();
  if (!sessionCookie) {
    console.log('❌ Cannot authenticate');
    return;
  }
  
  console.log('✅ Authenticated successfully');
  
  // Create a quiz first
  const quizPayload = {
    title: "Bob Submission Test",
    description: "Testing submission",
    question_count: 2,
    categories: ["dangerous-goods"],
    is_active: true,
    expires_at: null
  };
  
  const createResponse = await fetch('http://localhost:5000/api/quizzes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie
    },
    body: JSON.stringify(quizPayload)
  });
  
  if (!createResponse.ok) {
    console.log('❌ Quiz creation failed');
    return;
  }
  
  const quiz = await createResponse.json();
  console.log('✅ Quiz created:', quiz.id);
  
  // Get questions
  const questionsResponse = await fetch(`http://localhost:5000/api/quizzes/${quiz.id}/questions`);
  const questions = await questionsResponse.json();
  
  if (!questionsResponse.ok || questions.length === 0) {
    console.log('❌ Questions failed:', questions);
    return;
  }
  
  console.log('✅ Questions loaded:', questions.length);
  console.log('Question IDs:', questions.map(q => q.id));
  
  // Test different submission payload formats
  const testPayloads = [
    {
      name: "Frontend Format",
      payload: {
        userId: 9,
        answers: questions.map(q => ({
          questionId: q.id,
          answeredOption: 0
        })),
        squadron: "TEST"
      }
    },
    {
      name: "Backend Expected Format",
      payload: {
        answers: questions.map(q => ({
          questionId: q.id,
          answeredOption: 0
        })),
        squadron: "TEST"
      }
    },
    {
      name: "Alternative Format",
      payload: {
        answers: questions.map(q => ({
          questionId: q.id,
          answeredOption: "0"
        })),
        squadron: "TEST"
      }
    }
  ];
  
  for (const test of testPayloads) {
    console.log(`\n🧪 Testing ${test.name}:`);
    console.log('Payload:', JSON.stringify(test.payload, null, 2));
    
    try {
      const submitResponse = await fetch(`http://localhost:5000/api/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie
        },
        body: JSON.stringify(test.payload)
      });
      
      const result = await submitResponse.json();
      
      if (submitResponse.ok) {
        console.log('✅ SUCCESS:', result);
        return; // Stop on first success
      } else {
        console.log('❌ FAILED:', result);
      }
    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }
  }
}

testQuizSubmission().catch(console.error);

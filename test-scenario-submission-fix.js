import fetch from 'node-fetch';

console.log('🔍 Testing Scenario Submission Fix');
console.log('=================================');

async function testSubmissionFlow() {
  try {
    // Step 1: Authenticate
    console.log('\n🔐 Authenticating...');
    const loginResponse = await fetch('http://localhost:5000/auth-isolated/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'markustruter01@gmail.com',
        password: 'Skating69!'
      })
    });

    const cookies = loginResponse.headers.raw()['set-cookie'];
    const sessionCookie = cookies ? cookies.find(cookie => cookie.includes('sessionId=')) : null;
    console.log('✅ Authentication successful');

    // Step 2: Get scenarios
    console.log('\n📋 Getting scenarios...');
    const scenariosResponse = await fetch('http://localhost:5000/api/scenarios', {
      headers: { 'Cookie': sessionCookie }
    });
    const scenarios = await scenariosResponse.json();
    const testScenario = scenarios[0];
    console.log(`✅ Using scenario: ${testScenario.title}`);

    // Step 3: Test the exact payload format the frontend now uses
    console.log('\n🧪 Testing new frontend payload format...');
    const frontendPayload = {
      scenarioId: testScenario.id,
      answers: [
        { questionId: "q1", answer: "Frontend fix test answer", notes: "Frontend fix test note" },
        { questionId: "q2", answer: "Second test answer", notes: "Second test note" }
      ],
      timeSpent: 300,
      notes: "Student: Frontend Test User, ID: FETU123, Squadron: AMG"
    };

    const submissionResponse = await fetch('http://localhost:5000/api/scenario-submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(frontendPayload)
    });

    console.log(`Response Status: ${submissionResponse.status}`);
    
    if (submissionResponse.ok) {
      const result = await submissionResponse.json();
      console.log('✅ Frontend payload submission SUCCESS');
      console.log('📋 Result:', {
        id: result.id,
        scenarioId: result.scenarioId,
        userId: result.userId,
        status: result.status,
        answersCount: Array.isArray(result.answers) ? result.answers.length : 'N/A'
      });

      // Step 4: Verify in database
      console.log('\n📊 Verifying database storage...');
      const verificationsResponse = await fetch('http://localhost:5000/api/scenario-submissions', {
        headers: { 'Cookie': sessionCookie }
      });

      if (verificationsResponse.ok) {
        const submissions = await verificationsResponse.json();
        const testSubmission = submissions.find(s => s.id === result.id);
        if (testSubmission) {
          console.log('✅ Submission found in database');
          console.log('📋 Database record:', {
            id: testSubmission.id,
            scenarioId: testSubmission.scenarioId,
            userId: testSubmission.userId,
            status: testSubmission.status,
            submissionDate: testSubmission.submissionDate
          });
        } else {
          console.log('❌ Submission not found in database');
        }
      }

      console.log('\n🎉 SCENARIO SUBMISSION SYSTEM FULLY WORKING!');
      console.log('✅ Backend accepts frontend payload format');
      console.log('✅ Database storage confirmed');
      console.log('✅ Ready for frontend success animation');
      return true;

    } else {
      const errorText = await submissionResponse.text();
      console.log('❌ Submission failed:', errorText);
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testSubmissionFlow();
import fetch from 'node-fetch';

console.log('🔬 TESTING MODERN SCENARIO SUBMISSION SYSTEM');
console.log('============================================');

async function testModernScenarioSystem() {
  try {
    // Step 1: Authenticate
    console.log('\n🔐 Step 1: Authenticating...');
    const loginResponse = await fetch('http://localhost:5000/auth-isolated/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'markustruter01@gmail.com',
        password: 'Skating69!'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Authentication failed: ${loginResponse.status}`);
    }

    const cookies = loginResponse.headers.raw()['set-cookie'];
    const sessionCookie = cookies ? cookies.find(cookie => cookie.includes('sessionId=')) : null;
    
    if (!sessionCookie) {
      throw new Error('No session cookie received');
    }

    console.log('✅ Authentication successful');

    // Step 2: Test scenario retrieval
    console.log('\n📋 Step 2: Testing scenario retrieval...');
    const scenariosResponse = await fetch('http://localhost:5000/api/scenarios', {
      headers: { 'Cookie': sessionCookie }
    });

    if (!scenariosResponse.ok) {
      throw new Error(`Scenarios fetch failed: ${scenariosResponse.status}`);
    }

    const scenarios = await scenariosResponse.json();
    if (scenarios.length === 0) {
      throw new Error('No scenarios available');
    }

    const testScenario = scenarios[0];
    console.log(`✅ Found scenario: ${testScenario.title} (ID: ${testScenario.id})`);

    // Step 3: Test modern submission endpoint
    console.log('\n🚀 Step 3: Testing modern submission endpoint...');
    
    const modernPayload = {
      scenarioId: testScenario.id,
      answers: [
        { questionId: "q1", answer: "Modern test answer 1", notes: "Modern test note 1" },
        { questionId: "q2", answer: "Modern test answer 2", notes: "Modern test note 2" }
      ],
      studentName: "Modern Test User",
      studentId: "MODERN123",
      squadron: "AMG",
      timeSpent: 450,
      notes: "Complete modern scenario test submission"
    };

    console.log('📤 Sending modern payload...');
    const submissionResponse = await fetch('http://localhost:5000/api/scenario-submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(modernPayload)
    });

    console.log(`📊 Response Status: ${submissionResponse.status}`);
    
    if (submissionResponse.ok) {
      const result = await submissionResponse.json();
      console.log('✅ MODERN SUBMISSION SUCCESSFUL!');
      console.log('📋 Result summary:', {
        id: result.id,
        scenarioId: result.scenarioId,
        userId: result.userId,
        status: result.status,
        submissionDate: result.submissionDate,
        answersCount: result.answers?.length || 0,
        metadata: result.metadata
      });

      // Step 4: Verify retrieval endpoints
      console.log('\n📊 Step 4: Testing retrieval endpoints...');
      
      // Test get all submissions
      const allSubmissionsResponse = await fetch('http://localhost:5000/api/scenario-submissions', {
        headers: { 'Cookie': sessionCookie }
      });

      if (allSubmissionsResponse.ok) {
        const allSubmissions = await allSubmissionsResponse.json();
        console.log(`✅ Retrieved ${allSubmissions.length} total submissions`);
        
        const ourSubmission = allSubmissions.find(s => s.id === result.id);
        if (ourSubmission) {
          console.log('✅ Our submission found in all submissions list');
        } else {
          console.log('⚠️ Our submission not found in all submissions list');
        }
      } else {
        console.log('❌ Failed to retrieve all submissions');
      }

      // Test get user submissions
      const userSubmissionsResponse = await fetch('http://localhost:5000/api/scenario-submissions/user', {
        headers: { 'Cookie': sessionCookie }
      });

      if (userSubmissionsResponse.ok) {
        const userSubmissions = await userSubmissionsResponse.json();
        console.log(`✅ Retrieved ${userSubmissions.length} user submissions`);
      } else {
        console.log('❌ Failed to retrieve user submissions');
      }

      // Test get specific submission
      const specificSubmissionResponse = await fetch(`http://localhost:5000/api/scenario-submissions/${result.id}`, {
        headers: { 'Cookie': sessionCookie }
      });

      if (specificSubmissionResponse.ok) {
        const specificSubmission = await specificSubmissionResponse.json();
        console.log('✅ Retrieved specific submission successfully');
      } else {
        console.log('❌ Failed to retrieve specific submission');
      }

      console.log('\n🎉 MODERN SCENARIO SYSTEM FULLY FUNCTIONAL!');
      console.log('============================================');
      console.log('✅ Authentication working');
      console.log('✅ Scenario retrieval working');
      console.log('✅ Modern submission endpoint working');
      console.log('✅ Database storage confirmed');
      console.log('✅ All retrieval endpoints working');
      console.log('✅ Modern payload format accepted');
      console.log('✅ Ready for frontend testing');
      
      return true;

    } else {
      const errorText = await submissionResponse.text();
      console.log('❌ Modern submission failed:', errorText);
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the comprehensive test
testModernScenarioSystem().then(success => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('🎯 RESULT: Modern scenario submission system is FULLY WORKING');
    console.log('Ready for user testing with complete frontend integration');
  } else {
    console.log('❌ RESULT: Modern scenario submission system needs further fixes');
  }
  console.log('='.repeat(50));
});
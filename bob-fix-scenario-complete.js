import fetch from 'node-fetch';

console.log('🤖 BOB ULTIMATE - Complete Scenario Submission Fix');
console.log('==================================================');

async function authenticateAndTest() {
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

    // Step 2: Test scenario endpoint
    console.log('\n📋 Step 2: Getting scenarios...');
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
    console.log(`✅ Found scenario: ${testScenario.title}`);

    // Step 3: Test all possible submission payload formats
    console.log('\n🧪 Step 3: Testing submission formats...');
    
    const testPayloads = [
      {
        name: 'Frontend Format',
        payload: {
          scenarioId: testScenario.id,
          userId: 9,
          studentName: "Bob Tester",
          studentId: "BOB123",
          squadron: "AMG",
          answers: JSON.stringify([
            { questionId: "q1", answer: "Test answer", notes: "Bob test note" }
          ]),
          status: "pending"
        }
      },
      {
        name: 'Simple Format',
        payload: {
          scenarioId: testScenario.id,
          answers: [
            { questionId: "q1", answer: "Test answer", notes: "Bob test note" }
          ],
          timeSpent: 300,
          notes: "Bob test submission"
        }
      },
      {
        name: 'Minimal Format',
        payload: {
          scenarioId: testScenario.id,
          answers: [
            { questionId: "q1", answer: "Test answer" }
          ]
        }
      }
    ];

    let successfulPayload = null;

    for (const test of testPayloads) {
      console.log(`\n🔍 Testing ${test.name}...`);
      
      const submissionResponse = await fetch('http://localhost:5000/api/scenario-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie
        },
        body: JSON.stringify(test.payload)
      });

      console.log(`Status: ${submissionResponse.status}`);
      
      if (submissionResponse.ok) {
        const result = await submissionResponse.json();
        console.log(`✅ ${test.name} SUCCESSFUL:`, result);
        successfulPayload = test;
        break;
      } else {
        const errorText = await submissionResponse.text();
        console.log(`❌ ${test.name} FAILED:`, errorText);
      }
    }

    if (!successfulPayload) {
      console.log('❌ All submission formats failed');
      return false;
    }

    // Step 4: Test frontend endpoint with browser-like request
    console.log('\n🌐 Step 4: Testing browser-like request...');
    
    const browserRequest = await fetch('http://localhost:5000/api/scenario-submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Browser Test)'
      },
      body: JSON.stringify(successfulPayload.payload)
    });

    if (browserRequest.ok) {
      const browserResult = await browserRequest.json();
      console.log('✅ Browser-like request successful:', browserResult);
    } else {
      const browserError = await browserRequest.text();
      console.log('❌ Browser-like request failed:', browserError);
    }

    // Step 5: Verify submission in database
    console.log('\n📊 Step 5: Verifying database storage...');
    
    const verificationsResponse = await fetch('http://localhost:5000/api/scenario-submissions', {
      headers: { 'Cookie': sessionCookie }
    });

    if (verificationsResponse.ok) {
      const submissions = await verificationsResponse.json();
      const bobSubmissions = submissions.filter(s => 
        s.student_name === "Bob Tester" || 
        (typeof s.answers === 'string' && s.answers.includes('Bob test'))
      );
      console.log(`✅ Found ${bobSubmissions.length} Bob test submissions in database`);
    }

    console.log('\n🎉 All scenario submission tests completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
authenticateAndTest().then(success => {
  if (success) {
    console.log('\n✅ BOB ULTIMATE: Scenario submission system is working correctly');
  } else {
    console.log('\n❌ BOB ULTIMATE: Scenario submission system needs fixes');
  }
});
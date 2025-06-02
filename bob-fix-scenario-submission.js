import fetch from 'node-fetch';

console.log('🤖 BOB ULTIMATE - Scenario Submission Diagnostic & Fix');
console.log('=======================================================');

async function authenticate() {
  try {
    const loginResponse = await fetch('http://localhost:5000/api/isolated/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'markustruter01@gmail.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginResult = await loginResponse.json();
    console.log('✅ Login successful:', loginResult.message);

    const cookies = loginResponse.headers.get('set-cookie');
    if (!cookies) {
      throw new Error('No cookies received');
    }

    console.log('✅ Authenticated successfully');
    return cookies;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    process.exit(1);
  }
}

async function testScenarioSubmission() {
  console.log('\n🔍 TESTING SCENARIO SUBMISSION');
  console.log('------------------------------');

  const sessionCookie = await authenticate();

  // Test scenario submission with different payload formats
  const testPayloads = [
    {
      name: 'Current Format',
      data: {
        scenario_id: 1,
        loadPlan: {
          aircraft: 'C-17',
          weight: 50000,
          cargo: ['Test cargo']
        },
        notes: 'Bob test submission'
      }
    },
    {
      name: 'Alternative Format 1',
      data: {
        scenarioId: 1,
        answers: [
          { questionId: '1', answer: 'Test answer', notes: 'Bob test' }
        ],
        timeSpent: 300,
        notes: 'Bob authentication test'
      }
    },
    {
      name: 'Alternative Format 2',
      data: {
        scenario_id: 1,
        answers: JSON.stringify([
          { questionId: '1', answer: 'Test answer', notes: 'Bob test' }
        ]),
        notes: 'Bob test submission',
        status: 'submitted'
      }
    }
  ];

  for (const testCase of testPayloads) {
    console.log(`\n🧪 Testing ${testCase.name}:`);
    console.log('Payload:', JSON.stringify(testCase.data, null, 2));

    try {
      const response = await fetch('http://localhost:5000/api/scenario-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie
        },
        body: JSON.stringify(testCase.data)
      });

      const result = await response.text();
      
      if (response.ok) {
        console.log('✅ SUCCESS:', JSON.parse(result));
        return; // Stop on first success
      } else {
        console.log(`❌ FAILED (${response.status}):`, result);
      }
    } catch (error) {
      console.log('❌ ERROR:', error.message);
    }
  }

  console.log('\n❌ All test formats failed. Checking backend logs...');
}

testScenarioSubmission().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
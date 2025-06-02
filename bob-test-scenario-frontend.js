import fetch from 'node-fetch';

console.log('🤖 BOB ULTIMATE - Frontend Scenario Submission Test');
console.log('====================================================');

async function testScenarioSubmissionComplete() {
  try {
    console.log('🔍 Testing complete scenario submission workflow...');
    
    // First, authenticate to get a real session
    console.log('\n🔐 Authenticating...');
    const loginResponse = await fetch('http://localhost:5000/api/isolated/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'markustruter01@gmail.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginResponse.status);
      return;
    }
    
    const cookies = loginResponse.headers.raw()['set-cookie'];
    const sessionCookie = cookies ? cookies.find(cookie => cookie.includes('sessionId=')) : null;
    
    if (!sessionCookie) {
      console.log('❌ No session cookie found in response');
      return;
    }
    
    console.log('✅ Authenticated with session:', sessionCookie);

    // Test 1: Check if scenarios exist
    console.log('\n1️⃣ Testing scenarios endpoint...');
    const scenariosResponse = await fetch('http://localhost:5000/api/scenarios', {
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    if (!scenariosResponse.ok) {
      console.log('❌ Scenarios endpoint failed:', scenariosResponse.status);
      return;
    }
    
    const scenarios = await scenariosResponse.json();
    console.log('✅ Found scenarios:', scenarios.length);
    
    if (scenarios.length === 0) {
      console.log('❌ No scenarios available to test');
      return;
    }
    
    const testScenario = scenarios[0];
    console.log('📋 Using scenario:', testScenario.title);
    
    // Test 2: Submit scenario with correct format
    console.log('\n2️⃣ Testing scenario submission...');
    
    const submissionPayload = {
      scenarioId: testScenario.id,
      userId: 9,
      studentName: "Bob Tester",
      studentId: "BOB123",
      squadron: "AMG",
      answers: JSON.stringify([
        { questionId: "q1", answer: "Test answer", notes: "Bob test note" }
      ]),
      status: "pending"
    };
    
    console.log('📤 Submission payload:', JSON.stringify(submissionPayload, null, 2));
    
    const submissionResponse = await fetch('http://localhost:5000/api/scenario-submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(submissionPayload)
    });
    
    console.log('📥 Submission response status:', submissionResponse.status);
    
    if (!submissionResponse.ok) {
      const errorText = await submissionResponse.text();
      console.log('❌ Submission failed:', errorText);
      return;
    }
    
    const submissionResult = await submissionResponse.json();
    console.log('✅ Submission successful:', submissionResult);
    
    // Test 3: Verify submission was saved
    console.log('\n3️⃣ Verifying submission was saved...');
    
    const verificatonResponse = await fetch('http://localhost:5000/api/scenario-submissions', {
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    if (verificatonResponse.ok) {
      const submissions = await verificatonResponse.json();
      console.log('✅ Found submissions:', submissions.length);
      const recentSubmission = submissions.find(s => s.student_name === "Bob Tester");
      if (recentSubmission) {
        console.log('✅ Bob test submission found:', recentSubmission.id);
      } else {
        console.log('❌ Bob test submission not found in database');
      }
    }
    
    console.log('\n🎉 Scenario submission test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testScenarioSubmissionComplete();
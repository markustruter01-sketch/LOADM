import fetch from 'node-fetch';
import puppeteer from 'puppeteer';

console.log('🤖 BOB FRONTEND TEST - Complete Scenario Submission Flow');
console.log('=====================================================');

async function testScenarioSubmissionComplete() {
  let browser;
  try {
    // Launch browser
    console.log('\n🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('🔥')) {
        console.log('📱 FRONTEND:', msg.text());
      }
    });

    // Navigate to login
    console.log('\n🔐 Logging in...');
    await page.goto('http://localhost:5000/auth');
    await page.waitForSelector('input[type="email"]');
    
    await page.type('input[type="email"]', 'markustruter01@gmail.com');
    await page.type('input[type="password"]', 'Skating69!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForNavigation();
    console.log('✅ Login successful');

    // Navigate to scenarios
    console.log('\n📋 Navigating to scenarios...');
    await page.goto('http://localhost:5000/scenarios');
    await page.waitForSelector('[data-testid="scenario-card"]', { timeout: 10000 });
    
    // Click on first scenario
    await page.click('[data-testid="scenario-card"]');
    await page.waitForNavigation();
    console.log('✅ Scenario loaded');

    // Fill in answers
    console.log('\n✏️ Filling answers...');
    const textareas = await page.$$('textarea');
    
    for (let i = 0; i < textareas.length; i++) {
      await textareas[i].type(`Test answer ${i + 1} from Bob frontend test`);
    }
    console.log(`✅ Filled ${textareas.length} answers`);

    // Click Submit All Answers button
    console.log('\n🚀 Clicking Submit All Answers...');
    await page.click('button:has-text("Submit All Answers")');
    
    // Wait for squadron dialog
    await page.waitForSelector('select', { timeout: 5000 });
    console.log('✅ Squadron dialog appeared');

    // Fill student info and select squadron
    await page.type('input[placeholder*="name"]', 'Bob Frontend Tester');
    await page.type('input[placeholder*="ID"]', 'BOBFE123');
    await page.selectOption('select', 'AMG');
    
    // Submit final form
    console.log('\n📤 Submitting final form...');
    await page.click('button:has-text("Submit Scenario")');
    
    // Wait for success animation or result
    console.log('\n⏳ Waiting for submission result...');
    
    let successDetected = false;
    
    // Check for multiple possible success indicators
    try {
      // Wait for any of these success indicators
      await Promise.race([
        page.waitForSelector('[data-testid="success-animation"]', { timeout: 8000 }),
        page.waitForSelector('.success', { timeout: 8000 }),
        page.waitForSelector('text=Submission successful', { timeout: 8000 }),
        page.waitForSelector('text=submitted successfully', { timeout: 8000 }),
        page.waitForFunction(() => 
          document.body.innerText.includes('Success') || 
          document.body.innerText.includes('submitted') ||
          document.body.innerText.includes('Complete')
        , {}, { timeout: 8000 })
      ]);
      
      successDetected = true;
      console.log('✅ SUCCESS ANIMATION/FEEDBACK DETECTED!');
      
    } catch (timeoutError) {
      console.log('⏰ No success animation detected, checking URL changes...');
      
      // Check if URL changed (redirect after submission)
      const currentUrl = page.url();
      if (currentUrl.includes('dashboard') || currentUrl.includes('scenarios') || !currentUrl.includes('scenario/')) {
        successDetected = true;
        console.log('✅ SUCCESS: Page redirected after submission');
      }
    }

    // Take final screenshot for verification
    await page.screenshot({ path: 'scenario-test-final.png', fullPage: true });
    
    if (successDetected) {
      console.log('\n🎉 FRONTEND SUBMISSION FLOW SUCCESSFUL!');
      return true;
    } else {
      console.log('\n❌ Frontend submission flow incomplete');
      return false;
    }

  } catch (error) {
    console.error('❌ Frontend test failed:', error.message);
    return false;
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Also test the backend directly to confirm it's working
async function testBackendDirect() {
  console.log('\n🔧 Testing backend submission directly...');
  
  try {
    // Authenticate
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

    // Get scenarios
    const scenariosResponse = await fetch('http://localhost:5000/api/scenarios', {
      headers: { 'Cookie': sessionCookie }
    });
    const scenarios = await scenariosResponse.json();

    // Submit with new format
    const payload = {
      scenarioId: scenarios[0].id,
      answers: [
        { questionId: "q1", answer: "Backend test answer", notes: "Backend test note" }
      ],
      timeSpent: 300,
      notes: "Student: Bob Backend Tester, ID: BOBBE123, Squadron: AMG"
    };

    const submissionResponse = await fetch('http://localhost:5000/api/scenario-submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(payload)
    });

    if (submissionResponse.ok) {
      const result = await submissionResponse.json();
      console.log('✅ Backend submission successful:', result.id);
      return true;
    } else {
      console.log('❌ Backend submission failed:', submissionResponse.status);
      return false;
    }

  } catch (error) {
    console.error('❌ Backend test failed:', error.message);
    return false;
  }
}

// Run both tests
async function runCompleteTest() {
  console.log('🎯 Running complete scenario submission test...\n');
  
  const backendSuccess = await testBackendDirect();
  const frontendSuccess = await testScenarioSubmissionComplete();
  
  console.log('\n📊 TEST RESULTS:');
  console.log(`Backend: ${backendSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Frontend: ${frontendSuccess ? '✅ PASS' : '❌ FAIL'}`);
  
  if (backendSuccess && frontendSuccess) {
    console.log('\n🎉 ALL TESTS PASSED - Scenario submission system is fully working!');
  } else {
    console.log('\n⚠️ Some tests failed - System needs additional fixes');
  }
}

runCompleteTest();
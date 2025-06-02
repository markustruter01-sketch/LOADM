import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Comprehensive analytics testing
async function testAnalyticsSystem() {
  console.log('🧪 Starting comprehensive analytics system test...\n');
  
  try {
    // Test 1: Quiz submissions API endpoint
    console.log('1️⃣ Testing quiz submissions API...');
    const quizResponse = await fetch(`${BASE_URL}/api/instructor/quiz-submissions`);
    if (quizResponse.ok) {
      const quizData = await quizResponse.json();
      console.log(`✅ Quiz submissions API working: ${quizData.length} submissions found`);
      
      // Check squadron format
      const squadrons = [...new Set(quizData.map(sub => sub.squadron))];
      console.log(`   Squadrons found: ${squadrons.join(', ')}`);
      
      // Check data structure
      if (quizData.length > 0) {
        const sample = quizData[0];
        console.log(`   Sample data structure: ${Object.keys(sample).join(', ')}`);
      }
    } else {
      console.log(`❌ Quiz submissions API failed: ${quizResponse.status}`);
    }
    
    // Test 2: Scenario submissions API endpoint
    console.log('\n2️⃣ Testing scenario submissions API...');
    const scenarioResponse = await fetch(`${BASE_URL}/api/scenario-submissions`);
    if (scenarioResponse.ok) {
      const scenarioData = await scenarioResponse.json();
      console.log(`✅ Scenario submissions API working: ${scenarioData.length} submissions found`);
      
      // Check squadron format
      const squadrons = [...new Set(scenarioData.map(sub => sub.squadron))];
      console.log(`   Squadrons found: ${squadrons.join(', ')}`);
    } else {
      console.log(`❌ Scenario submissions API failed: ${scenarioResponse.status}`);
    }
    
    // Test 3: Users API endpoint
    console.log('\n3️⃣ Testing users API...');
    const usersResponse = await fetch(`${BASE_URL}/api/users`);
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log(`✅ Users API working: ${usersData.length} users found`);
    } else {
      console.log(`❌ Users API failed: ${usersResponse.status}`);
    }
    
    // Test 4: Quizzes API endpoint
    console.log('\n4️⃣ Testing quizzes API...');
    const quizzesResponse = await fetch(`${BASE_URL}/api/quizzes`);
    if (quizzesResponse.ok) {
      const quizzesData = await quizzesResponse.json();
      console.log(`✅ Quizzes API working: ${quizzesData.length} quizzes found`);
    } else {
      console.log(`❌ Quizzes API failed: ${quizzesResponse.status}`);
    }
    
    // Test 5: Database consistency check
    console.log('\n5️⃣ Checking database consistency...');
    await checkDatabaseConsistency();
    
    console.log('\n📊 Analytics system test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function checkDatabaseConsistency() {
  try {
    // This would need to be run with database access
    console.log('   Database consistency check would require direct SQL access');
  } catch (error) {
    console.log('   Could not check database directly');
  }
}

// Frontend simulation test
async function simulateFrontendDataFlow() {
  console.log('\n🎯 Simulating frontend data flow...\n');
  
  try {
    // Simulate quiz analytics page data fetching
    console.log('📈 Quiz Analytics Page Simulation:');
    
    const submissions = await fetch(`${BASE_URL}/api/instructor/quiz-submissions`)
      .then(res => res.ok ? res.json() : []);
    
    const users = await fetch(`${BASE_URL}/api/users`)
      .then(res => res.ok ? res.json() : []);
    
    const quizzes = await fetch(`${BASE_URL}/api/quizzes`)
      .then(res => res.ok ? res.json() : []);
    
    console.log(`   Fetched: ${submissions.length} submissions, ${users.length} users, ${quizzes.length} quizzes`);
    
    // Calculate analytics like frontend would
    if (submissions.length > 0) {
      const squadronStats = {};
      const scoreRanges = { '0-49': 0, '50-69': 0, '70-89': 0, '90-100': 0 };
      
      submissions.forEach(sub => {
        // Squadron tracking
        if (!squadronStats[sub.squadron]) {
          squadronStats[sub.squadron] = { count: 0, totalScore: 0 };
        }
        squadronStats[sub.squadron].count++;
        squadronStats[sub.squadron].totalScore += sub.score;
        
        // Score distribution
        if (sub.score < 50) scoreRanges['0-49']++;
        else if (sub.score < 70) scoreRanges['50-69']++;
        else if (sub.score < 90) scoreRanges['70-89']++;
        else scoreRanges['90-100']++;
      });
      
      console.log('   Squadron performance:');
      Object.entries(squadronStats).forEach(([squadron, stats]) => {
        const avgScore = Math.round(stats.totalScore / stats.count);
        console.log(`     ${squadron}: ${stats.count} submissions, ${avgScore}% avg score`);
      });
      
      console.log('   Score distribution:', scoreRanges);
      
      const totalScore = submissions.reduce((sum, sub) => sum + sub.score, 0);
      const avgScore = Math.round(totalScore / submissions.length);
      const passRate = Math.round((submissions.filter(sub => sub.score >= 70).length / submissions.length) * 100);
      
      console.log(`   Overall: ${avgScore}% average, ${passRate}% pass rate`);
    }
    
  } catch (error) {
    console.error('❌ Frontend simulation failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  await testAnalyticsSystem();
  await simulateFrontendDataFlow();
  
  console.log('\n🏁 All tests completed!');
  console.log('\nIf analytics pages still show no data, check:');
  console.log('- Frontend API calls match backend endpoints');
  console.log('- Data format consistency between frontend and backend');
  console.log('- Authentication middleware on API endpoints');
  console.log('- Browser network tab for failed requests');
}

runAllTests();
// Bob Scenario Submissions Generator
// Creates scenario submissions with authentication
import fs from 'fs';

class BobScenarioSubmissionsGenerator {
  constructor() {
    this.sessionCookie = null;
    this.results = {
      submissionsCreated: 0,
      details: []
    };
  }

  async generateScenarioSubmissions() {
    console.log('🤖 Bob: Creating scenario submissions with authentication...');
    
    try {
      // First authenticate
      await this.authenticate();
      
      // Create scenario submissions
      await this.createScenarioSubmissions();
      
      return this.generateReport();
      
    } catch (error) {
      console.error('Scenario submission generation failed:', error.message);
      this.results.details.push(`Error: ${error.message}`);
      return this.results;
    }
  }

  async authenticate() {
    const fetch = (await import('node-fetch')).default;
    const baseUrl = 'http://localhost:5000';
    
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'markustruter01@gmail.com',
        password: 'password123'
      })
    });

    if (loginResponse.ok) {
      // Extract session cookie
      const cookies = loginResponse.headers.get('set-cookie');
      if (cookies) {
        this.sessionCookie = cookies.split(';')[0];
        this.results.details.push('✅ Authentication successful');
      }
    } else {
      throw new Error('Authentication failed');
    }
  }

  async createScenarioSubmissions() {
    const fetch = (await import('node-fetch')).default;
    const baseUrl = 'http://localhost:5000';
    
    // Get scenarios
    const scenariosResponse = await fetch(`${baseUrl}/api/scenarios`, {
      headers: { 'Cookie': this.sessionCookie }
    });
    const scenarios = await scenariosResponse.json();
    
    if (scenarios.length === 0) {
      this.results.details.push('No scenarios available');
      return;
    }

    const squadrons = ['AMG', '33SQN', '35SQN', '36SQN', '37SQN'];
    const studentNames = [
      'Emma Thompson', 'James Wilson', 'Sarah Connor', 'Michael Johnson', 'Lisa Garcia',
      'David Brown', 'Jennifer Davis', 'Robert Miller', 'Amanda White', 'Christopher Lee',
      'Michelle Rodriguez', 'Kevin Anderson', 'Jessica Taylor', 'Daniel Martinez', 'Ashley Clark',
      'Matthew Lewis', 'Nicole Walker', 'Ryan Hall', 'Stephanie Young', 'Brandon King',
      'Samantha Wright', 'Justin Green', 'Rachel Adams', 'Derek Nelson', 'Megan Carter'
    ];

    for (let i = 0; i < 25 && i < studentNames.length; i++) {
      const squadron = squadrons[i % squadrons.length];
      const studentId = `${2000 + i} - ${squadron}`;
      const studentName = studentNames[i];
      
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      
      // Generate varied scores
      const score = this.generateVariedScore(i);
      const totalQuestions = 10;
      const correctAnswers = Math.round((score / 100) * totalQuestions);
      
      // Create marked answers
      const markedAnswers = {};
      for (let q = 1; q <= totalQuestions; q++) {
        markedAnswers[`question_${q}`] = q <= correctAnswers;
      }
      
      // Generate submission date
      const submissionDate = new Date();
      submissionDate.setDate(submissionDate.getDate() - Math.floor(Math.random() * 90));
      
      const submissionData = {
        scenarioId: scenario.id,
        studentId: studentId,
        studentName: studentName,
        answers: [
          { questionId: 'q1', answer: 'Detailed analysis of cargo configuration', notes: 'Considered weight distribution' },
          { questionId: 'q2', answer: 'Safety protocols implemented correctly', notes: 'Referenced manual section 4.2' }
        ],
        markedAnswers: markedAnswers,
        instructorFeedback: score >= 70 ? 'Excellent understanding demonstrated' : 'Review weight calculations',
        score: score,
        passed: score >= 70,
        status: 'reviewed',
        submissionDate: submissionDate.toISOString()
      };

      try {
        const response = await fetch(`${baseUrl}/api/scenario-submissions`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cookie': this.sessionCookie
          },
          body: JSON.stringify(submissionData)
        });

        if (response.ok) {
          this.results.submissionsCreated++;
          this.results.details.push(`✅ Created scenario submission: ${studentName} (${score}%)`);
        } else {
          const errorText = await response.text();
          this.results.details.push(`❌ Failed scenario submission: ${studentName} - ${errorText}`);
        }
      } catch (error) {
        this.results.details.push(`❌ Error creating scenario submission: ${error.message}`);
      }
    }
  }

  generateVariedScore(index) {
    // Create realistic score distribution
    const patterns = [
      () => Math.floor(85 + Math.random() * 15), // High performers
      () => Math.floor(60 + Math.random() * 25), // Average performers
      () => Math.floor(40 + Math.random() * 20), // Struggling students
      () => Math.floor(10 + Math.random() * 30)  // Failing students
    ];
    
    let categoryIndex;
    if (index % 10 < 2) categoryIndex = 0;
    else if (index % 10 < 7) categoryIndex = 1;
    else if (index % 10 < 9) categoryIndex = 2;
    else categoryIndex = 3;
    
    return Math.min(100, Math.max(0, patterns[categoryIndex]()));
  }

  generateReport() {
    console.log('\n📊 Bob Scenario Submissions Report');
    console.log('==================================');
    console.log(`Scenario Submissions Created: ${this.results.submissionsCreated}`);
    
    console.log('\nDetailed Results:');
    this.results.details.forEach(detail => {
      console.log(`  ${detail}`);
    });
    
    return this.results;
  }
}

// Run Bob Scenario Submissions Generator
async function runBobScenarioSubmissions() {
  const bob = new BobScenarioSubmissionsGenerator();
  const results = await bob.generateScenarioSubmissions();
  
  console.log('\n🤖 Bob: Scenario submissions generation complete');
  
  return results;
}

runBobScenarioSubmissions().catch(error => {
  console.error('Bob Scenario Submissions error:', error.message);
});
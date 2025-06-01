// Bob Advanced Test Data Generator
// Creates 50 diverse student assessment submissions for analytics testing
import fs from 'fs';

class BobTestDataGenerator {
  constructor() {
    this.students = [];
    this.scenarios = [];
    this.quizzes = [];
    this.submissions = [];
    this.results = {
      scenarioSubmissionsCreated: 0,
      quizSubmissionsCreated: 0,
      totalSubmissionsCreated: 0,
      scoreDistribution: {},
      squadronDistribution: {},
      details: []
    };
  }

  async generateComprehensiveTestData() {
    console.log('🤖 Bob Test Data Generator: Creating 50 diverse student submissions...');
    
    try {
      // Fetch existing data
      await this.fetchExistingData();
      
      // Generate diverse student submissions
      await this.createScenarioSubmissions(25); // 25 scenario submissions
      await this.createQuizSubmissions(25); // 25 quiz submissions
      
      return this.generateReport();
      
    } catch (error) {
      console.error('Test data generation failed:', error.message);
      this.results.details.push(`Error: ${error.message}`);
      return this.results;
    }
  }

  async fetchExistingData() {
    const fetch = (await import('node-fetch')).default;
    const baseUrl = 'http://localhost:5000';
    
    try {
      // Fetch scenarios
      const scenariosResponse = await fetch(`${baseUrl}/api/scenarios`);
      this.scenarios = await scenariosResponse.json();
      
      // Fetch quizzes
      const quizzesResponse = await fetch(`${baseUrl}/api/quizzes`);
      this.quizzes = await quizzesResponse.json();
      
      this.results.details.push(`Found ${this.scenarios.length} scenarios and ${this.quizzes.length} quizzes`);
      
    } catch (error) {
      this.results.details.push(`Failed to fetch existing data: ${error.message}`);
    }
  }

  async createScenarioSubmissions(count) {
    const fetch = (await import('node-fetch')).default;
    const baseUrl = 'http://localhost:5000';
    
    const squadrons = ['AMG', '33SQN', '35SQN', '36SQN', '37SQN'];
    const studentNames = [
      'Emma Thompson', 'James Wilson', 'Sarah Connor', 'Michael Johnson', 'Lisa Garcia',
      'David Brown', 'Jennifer Davis', 'Robert Miller', 'Amanda White', 'Christopher Lee',
      'Michelle Rodriguez', 'Kevin Anderson', 'Jessica Taylor', 'Daniel Martinez', 'Ashley Clark',
      'Matthew Lewis', 'Nicole Walker', 'Ryan Hall', 'Stephanie Young', 'Brandon King',
      'Samantha Wright', 'Justin Green', 'Rachel Adams', 'Derek Nelson', 'Megan Carter'
    ];

    for (let i = 0; i < count && i < studentNames.length; i++) {
      const squadron = squadrons[i % squadrons.length];
      const studentId = `${1000 + i} - ${squadron}`;
      const studentName = studentNames[i];
      
      // Select random scenario
      if (this.scenarios.length === 0) {
        this.results.details.push('No scenarios available for submissions');
        continue;
      }
      
      const scenario = this.scenarios[Math.floor(Math.random() * this.scenarios.length)];
      
      // Generate realistic answers with varying correctness
      const totalQuestions = 10; // Assume 10 questions per scenario
      const correctAnswers = this.generateVariedScore(i, totalQuestions);
      const score = Math.round((correctAnswers / totalQuestions) * 100);
      
      // Create marked answers object
      const markedAnswers = {};
      for (let q = 1; q <= totalQuestions; q++) {
        markedAnswers[`question_${q}`] = q <= correctAnswers;
      }
      
      // Generate submission date (last 3 months)
      const submissionDate = new Date();
      submissionDate.setDate(submissionDate.getDate() - Math.floor(Math.random() * 90));
      
      const submissionData = {
        scenarioId: scenario.id,
        studentId: studentId,
        studentName: studentName,
        answers: [
          { questionId: 'q1', answer: 'Sample answer 1', notes: 'Student notes' },
          { questionId: 'q2', answer: 'Sample answer 2', notes: 'Additional reasoning' }
        ],
        markedAnswers: markedAnswers,
        instructorFeedback: score >= 70 ? 'Good work!' : 'Needs improvement',
        score: score,
        passed: score >= 70,
        status: 'reviewed',
        submissionDate: submissionDate.toISOString()
      };

      try {
        const response = await fetch(`${baseUrl}/api/scenario-submissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submissionData)
        });

        if (response.ok) {
          this.results.scenarioSubmissionsCreated++;
          this.updateDistributions(squadron, score);
          this.results.details.push(`✅ Created scenario submission: ${studentName} (${score}%)`);
        } else {
          this.results.details.push(`❌ Failed scenario submission: ${studentName}`);
        }
      } catch (error) {
        this.results.details.push(`❌ Error creating scenario submission: ${error.message}`);
      }
    }
  }

  async createQuizSubmissions(count) {
    const fetch = (await import('node-fetch')).default;
    const baseUrl = 'http://localhost:5000';
    
    const squadrons = ['AMG', '33SQN', '35SQN', '36SQN', '37SQN'];
    const studentNames = [
      'Mark Davis', 'Laura Wilson', 'Paul Anderson', 'Maria Garcia', 'John Smith',
      'Emily Johnson', 'Carlos Rodriguez', 'Sophie Brown', 'Alex Thompson', 'Grace Lee',
      'Tyler Miller', 'Hannah White', 'Jordan Clark', 'Olivia Martinez', 'Lucas Taylor',
      'Chloe Walker', 'Mason Hall', 'Zoe Young', 'Ethan King', 'Ava Wright',
      'Noah Green', 'Mia Adams', 'Logan Nelson', 'Ella Carter', 'Jacob Mitchell'
    ];

    for (let i = 0; i < count && i < studentNames.length; i++) {
      const squadron = squadrons[i % squadrons.length];
      const studentName = studentNames[i];
      
      // Select random quiz
      if (this.quizzes.length === 0) {
        this.results.details.push('No quizzes available for submissions');
        continue;
      }
      
      const quiz = this.quizzes[Math.floor(Math.random() * this.quizzes.length)];
      
      // Generate realistic score with varied distribution
      const score = this.generateVariedScore(i + 25, 100); // Different pattern from scenarios
      
      // Generate submission date (last 3 months)
      const submissionDate = new Date();
      submissionDate.setDate(submissionDate.getDate() - Math.floor(Math.random() * 90));
      
      const submissionData = {
        quiz_id: quiz.id,
        user_id: 1000 + i, // Generate user IDs
        squadron: squadron,
        answers: JSON.stringify({
          q1: 'Answer 1',
          q2: 'Answer 2',
          q3: 'Answer 3'
        }),
        score: score,
        passed: score >= 70,
        submission_date: submissionDate.toISOString()
      };

      try {
        const response = await fetch(`${baseUrl}/api/quiz-submissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submissionData)
        });

        if (response.ok) {
          this.results.quizSubmissionsCreated++;
          this.updateDistributions(squadron, score);
          this.results.details.push(`✅ Created quiz submission: ${studentName} (${score}%)`);
        } else {
          this.results.details.push(`❌ Failed quiz submission: ${studentName}`);
        }
      } catch (error) {
        this.results.details.push(`❌ Error creating quiz submission: ${error.message}`);
      }
    }
  }

  generateVariedScore(index, maxScore) {
    // Create realistic score distribution
    const patterns = [
      // High performers (20%)
      () => Math.floor(85 + Math.random() * 15), // 85-100%
      // Average performers (50%)
      () => Math.floor(60 + Math.random() * 25), // 60-85%
      // Struggling students (20%)
      () => Math.floor(40 + Math.random() * 20), // 40-60%
      // Failing students (10%)
      () => Math.floor(10 + Math.random() * 30)  // 10-40%
    ];
    
    // Determine performance category based on index
    let categoryIndex;
    if (index % 10 < 2) categoryIndex = 0; // High performers
    else if (index % 10 < 7) categoryIndex = 1; // Average performers
    else if (index % 10 < 9) categoryIndex = 2; // Struggling students
    else categoryIndex = 3; // Failing students
    
    const score = patterns[categoryIndex]();
    return Math.min(maxScore, Math.max(0, score));
  }

  updateDistributions(squadron, score) {
    // Update squadron distribution
    this.results.squadronDistribution[squadron] = 
      (this.results.squadronDistribution[squadron] || 0) + 1;
    
    // Update score distribution
    let range;
    if (score >= 90) range = '90-100%';
    else if (score >= 70) range = '70-89%';
    else if (score >= 50) range = '50-69%';
    else range = '0-49%';
    
    this.results.scoreDistribution[range] = 
      (this.results.scoreDistribution[range] || 0) + 1;
  }

  generateReport() {
    this.results.totalSubmissionsCreated = 
      this.results.scenarioSubmissionsCreated + this.results.quizSubmissionsCreated;
    
    console.log('\n📊 Bob Test Data Generation Report');
    console.log('====================================');
    console.log(`Scenario Submissions Created: ${this.results.scenarioSubmissionsCreated}`);
    console.log(`Quiz Submissions Created: ${this.results.quizSubmissionsCreated}`);
    console.log(`Total Submissions Created: ${this.results.totalSubmissionsCreated}`);
    
    console.log('\nScore Distribution:');
    Object.entries(this.results.scoreDistribution).forEach(([range, count]) => {
      console.log(`  ${range}: ${count} submissions`);
    });
    
    console.log('\nSquadron Distribution:');
    Object.entries(this.results.squadronDistribution).forEach(([squadron, count]) => {
      console.log(`  ${squadron}: ${count} submissions`);
    });
    
    console.log('\nDetailed Results:');
    this.results.details.forEach(detail => {
      console.log(`  ${detail}`);
    });
    
    console.log('\n🎯 Analytics Testing Ready!');
    console.log('Generated diverse data for comprehensive analytics validation');
    
    return this.results;
  }
}

// Run Bob Test Data Generator
async function runBobTestDataGenerator() {
  const bob = new BobTestDataGenerator();
  const results = await bob.generateComprehensiveTestData();
  
  console.log('\n🤖 Bob: Test data generation complete');
  console.log('Advanced analytics can now be properly tested with authentic data');
  
  return results;
}

runBobTestDataGenerator().catch(error => {
  console.error('Bob Test Data Generator error:', error.message);
});
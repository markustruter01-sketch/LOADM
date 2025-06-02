import fetch from 'node-fetch';

// Configuration
const BASE_URL = 'http://localhost:5000';
const SQUADRONS = ['33 Squadron', '35 Squadron', '36 Squadron', '37 Squadron'];

// Sample student names for realistic data
const STUDENT_NAMES = [
  'James Wilson', 'Sarah Chen', 'Michael Brown', 'Emma Davis',
  'David Thompson', 'Lisa Anderson', 'Robert Miller', 'Jessica Taylor',
  'Christopher Moore', 'Amanda White', 'Daniel Harris', 'Rachel Green',
  'Matthew Clark', 'Nicole Lewis', 'Andrew Hall', 'Stephanie Young',
  'Joshua King', 'Michelle Lee', 'Kevin Wright', 'Ashley Scott',
  'Brian Adams', 'Lauren Baker', 'Ryan Nelson', 'Kimberly Hill',
  'Tyler Evans', 'Megan Carter', 'Nathan Phillips', 'Samantha Turner',
  'Brandon Mitchell', 'Crystal Roberts', 'Justin Campbell', 'Heather Parker',
  'Aaron Edwards', 'Danielle Collins', 'Sean Stewart', 'Vanessa Morris',
  'Marcus Reed', 'Tiffany Cooper'
];

// Quiz titles for realistic submissions
const QUIZ_TITLES = [
  'Aircraft Load Planning Fundamentals',
  'Weight and Balance Calculations',
  'Cargo Restraint Procedures',
  'C-17 Loading Protocols',
  'C-130 Configuration Standards',
  'Safety and Hazmat Handling',
  'Emergency Procedures Quiz',
  'Load Distribution Analysis'
];

// Function to generate random date within last 3 months
function randomDateInLast3Months() {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
  const randomTime = threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime());
  return new Date(randomTime);
}

// Function to generate realistic scores (mostly high with some variation)
function generateRealisticScore() {
  const rand = Math.random();
  if (rand < 0.15) {
    // 15% chance of lower scores (50-69%)
    return Math.floor(Math.random() * 20) + 50;
  } else if (rand < 0.25) {
    // 10% chance of medium scores (70-79%)
    return Math.floor(Math.random() * 10) + 70;
  } else if (rand < 0.70) {
    // 45% chance of good scores (80-89%)
    return Math.floor(Math.random() * 10) + 80;
  } else {
    // 30% chance of excellent scores (90-100%)
    return Math.floor(Math.random() * 11) + 90;
  }
}

// Function to generate random answers array
function generateAnswers(numQuestions = 10) {
  const answers = [];
  for (let i = 0; i < numQuestions; i++) {
    answers.push({
      questionId: `q${i + 1}`,
      answeredOption: Math.floor(Math.random() * 4) // 0-3 for A,B,C,D
    });
  }
  return answers;
}

// Generate test submissions
async function generateTestSubmissions() {
  console.log('🚀 Starting quiz test data generation...');
  
  try {
    // First, let's check what quizzes and users exist
    const quizzesResponse = await fetch(`${BASE_URL}/api/quizzes`);
    const quizzes = await quizzesResponse.json();
    
    const usersResponse = await fetch(`${BASE_URL}/api/users`);
    const users = await usersResponse.json();
    
    console.log(`Found ${quizzes.length} quizzes and ${users.length} users`);
    
    if (quizzes.length === 0) {
      console.log('⚠️ No quizzes found. Creating sample quizzes first...');
      
      // Create sample quizzes
      for (let i = 0; i < 3; i++) {
        const quizData = {
          title: QUIZ_TITLES[i],
          description: `Training quiz covering ${QUIZ_TITLES[i].toLowerCase()}`,
          isActive: true,
          questions: [
            {
              id: 'q1',
              question: `What is the most important factor in ${QUIZ_TITLES[i].toLowerCase()}?`,
              options: ['Safety first', 'Speed of operation', 'Cost efficiency', 'Documentation'],
              correctAnswer: 0
            },
            {
              id: 'q2', 
              question: 'Which regulation governs aircraft loading procedures?',
              options: ['RAAF Manual', 'Civil Aviation Orders', 'Loading Manual', 'All of the above'],
              correctAnswer: 3
            }
          ]
        };
        
        const createResponse = await fetch(`${BASE_URL}/api/quizzes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quizData)
        });
        
        if (createResponse.ok) {
          console.log(`✅ Created quiz: ${quizData.title}`);
        }
      }
      
      // Refresh quizzes list
      const newQuizzesResponse = await fetch(`${BASE_URL}/api/quizzes`);
      const newQuizzes = await newQuizzesResponse.json();
      quizzes.push(...newQuizzes);
    }
    
    if (users.length === 0) {
      console.log('⚠️ No users found. Cannot generate submissions without users.');
      return;
    }
    
    // Generate 38 submissions
    const submissions = [];
    
    for (let i = 0; i < 38; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomQuiz = quizzes[Math.floor(Math.random() * quizzes.length)];
      const squadron = SQUADRONS[Math.floor(Math.random() * SQUADRONS.length)];
      const score = generateRealisticScore();
      const submissionDate = randomDateInLast3Months();
      const answers = generateAnswers();
      
      const submission = {
        userId: randomUser.id,
        quizId: randomQuiz.id,
        squadron: squadron,
        score: score,
        answers: answers,
        submissionDate: submissionDate.toISOString(),
        status: 'completed'
      };
      
      submissions.push(submission);
    }
    
    // Sort by date to make submission more realistic
    submissions.sort((a, b) => new Date(a.submissionDate) - new Date(b.submissionDate));
    
    console.log('📊 Generated submissions summary:');
    console.log(`Total submissions: ${submissions.length}`);
    
    // Show squadron distribution
    const squadronCounts = {};
    submissions.forEach(sub => {
      squadronCounts[sub.squadron] = (squadronCounts[sub.squadron] || 0) + 1;
    });
    console.log('Squadron distribution:', squadronCounts);
    
    // Show score distribution
    const scoreRanges = { '0-49': 0, '50-69': 0, '70-89': 0, '90-100': 0 };
    submissions.forEach(sub => {
      if (sub.score < 50) scoreRanges['0-49']++;
      else if (sub.score < 70) scoreRanges['50-69']++;
      else if (sub.score < 90) scoreRanges['70-89']++;
      else scoreRanges['90-100']++;
    });
    console.log('Score distribution:', scoreRanges);
    
    // Submit all the data
    console.log('🔄 Submitting quiz submissions to database...');
    
    for (let i = 0; i < submissions.length; i++) {
      const submission = submissions[i];
      
      try {
        const response = await fetch(`${BASE_URL}/api/quiz-submissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submission)
        });
        
        if (response.ok) {
          console.log(`✅ Submission ${i + 1}/${submissions.length}: ${submission.squadron} - ${submission.score}%`);
        } else {
          console.log(`❌ Failed submission ${i + 1}: ${response.status} ${response.statusText}`);
        }
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error submitting ${i + 1}:`, error.message);
      }
    }
    
    console.log('✅ Quiz test data generation completed!');
    console.log('🎯 Check the Quiz Analytics page to see the results');
    
  } catch (error) {
    console.error('❌ Error during test data generation:', error);
  }
}

// Run the generation
generateTestSubmissions();
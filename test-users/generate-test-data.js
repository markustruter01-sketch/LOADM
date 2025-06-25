/**
 * TEST DATA GENERATOR
 * Creates 200 test users and 800 assessments across 4 squadrons
 * ISOLATED SYSTEM - Can be safely deleted without affecting main app
 */

import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Squadron distribution
const squadrons = ['33SQN', '35SQN', '36SQN', '37SQN'];

// Test user data generators
const firstNames = [
  'James', 'Robert', 'John', 'Michael', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Christopher',
  'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua',
  'Kenneth', 'Kevin', 'Brian', 'George', 'Timothy', 'Ronald', 'Jason', 'Edward', 'Jeffrey', 'Ryan',
  'Jacob', 'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon',
  'Benjamin', 'Samuel', 'Gregory', 'Alexander', 'Patrick', 'Frank', 'Raymond', 'Jack', 'Dennis', 'Jerry',
  'Tyler', 'Aaron', 'Jose', 'Henry', 'Adam', 'Douglas', 'Nathan', 'Peter', 'Zachary', 'Kyle',
  'Noah', 'Alan', 'Ethan', 'Jeremy', 'Lionel', 'Sean', 'Mason', 'Carl', 'Wayne', 'Ralph',
  'Roy', 'Eugene', 'Louis', 'Philip', 'Bobby', 'Johnny', 'Mason', 'Charlie', 'Billy', 'Arthur',
  'Jordan', 'Logan', 'Wayne', 'Ralph', 'Roy', 'Eugene', 'Louis', 'Philip', 'Bobby', 'Mason',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Nancy', 'Lisa', 'Betty', 'Helen', 'Sandra', 'Donna', 'Carol', 'Ruth', 'Sharon', 'Michelle',
  'Laura', 'Sarah', 'Kimberly', 'Deborah', 'Dorothy', 'Lisa', 'Nancy', 'Karen', 'Betty', 'Helen',
  'Sandra', 'Donna', 'Carol', 'Ruth', 'Sharon', 'Michelle', 'Laura', 'Sarah', 'Kimberly', 'Deborah',
  'Amy', 'Angela', 'Ashley', 'Brenda', 'Emma', 'Olivia', 'Cynthia', 'Marie', 'Janet', 'Catherine',
  'Frances', 'Christine', 'Samantha', 'Debra', 'Rachel', 'Carolyn', 'Janet', 'Virginia', 'Maria', 'Heather',
  'Diane', 'Julie', 'Joyce', 'Victoria', 'Kelly', 'Christina', 'Joan', 'Evelyn', 'Lauren', 'Judith',
  'Megan', 'Cheryl', 'Andrea', 'Hannah', 'Jacqueline', 'Martha', 'Gloria', 'Teresa', 'Sara', 'Janice',
  'Marie', 'Julia', 'Kathryn', 'Catherine', 'Frances', 'Christine', 'Samantha', 'Debra', 'Rachel', 'Carolyn',
  'Janet', 'Virginia', 'Maria', 'Heather', 'Diane', 'Julie', 'Joyce', 'Victoria', 'Kelly', 'Christina'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez'
];

// Quiz categories for realistic assessment data
const quizCategories = [
  'dangerous-goods',
  'loadmaster-fundamentals', 
  'emergency-procedures',
  'weight-balance',
  'cargo-securing',
  'aircraft-systems',
  'regulations',
  'equipment-handling'
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomScore() {
  // Generate realistic score distribution
  const rand = Math.random();
  if (rand < 0.15) return Math.floor(Math.random() * 50); // 15% fail badly (0-49)
  if (rand < 0.25) return Math.floor(Math.random() * 30) + 50; // 10% barely fail (50-79)
  if (rand < 0.70) return Math.floor(Math.random() * 15) + 80; // 45% pass well (80-94)
  return Math.floor(Math.random() * 6) + 95; // 30% excellent (95-100)
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function generateTestUsers() {
  console.log('🔧 Generating 200 test users...');
  
  const users = [];
  const hashedPassword = await bcrypt.hash('testpass123', 10);
  
  for (let i = 1; i <= 200; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const squadron = squadrons[(i - 1) % 4]; // Distribute evenly across squadrons
    
    const user = {
      email: `testuser${i}@testdomain.mil`,
      password: hashedPassword,
      firstName: firstName,
      lastName: lastName,
      squadron: squadron,
      role: 'student',
      isFirstLogin: false,
      hasCompletedOnboarding: true
    };
    
    users.push(user);
  }
  
  return users;
}

async function insertTestUsers(users) {
  console.log('📝 Inserting test users into database...');
  
  const insertUserQuery = `
    INSERT INTO users (email, password, first_name, last_name, squadron, role, is_first_login, has_completed_onboarding)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
  `;
  
  const userIds = [];
  
  for (const user of users) {
    try {
      const result = await pool.query(insertUserQuery, [
        user.email,
        user.password,
        user.firstName,
        user.lastName,
        user.squadron,
        user.role,
        user.isFirstLogin,
        user.hasCompletedOnboarding
      ]);
      
      userIds.push({
        id: result.rows[0].id,
        squadron: user.squadron,
        email: user.email
      });
    } catch (error) {
      console.error(`Failed to insert user ${user.email}:`, error.message);
    }
  }
  
  console.log(`✅ Successfully inserted ${userIds.length} test users`);
  return userIds;
}

async function generateTestQuizzes() {
  console.log('🎯 Creating test quizzes...');
  
  const quizzes = [];
  
  for (const category of quizCategories) {
    const quiz = {
      title: `${category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Assessment`,
      description: `Comprehensive assessment covering ${category.replace('-', ' ')} procedures and regulations`,
      questionCount: 15,
      timeLimit: 30,
      passingScore: 80,
      categories: [category],
      isActive: true
    };
    
    quizzes.push(quiz);
  }
  
  return quizzes;
}

async function insertTestQuizzes(quizzes) {
  console.log('📚 Inserting test quizzes into database...');
  
  const insertQuizQuery = `
    INSERT INTO quizzes (title, description, question_count, time_limit, passing_score, categories, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `;
  
  const quizIds = [];
  
  for (const quiz of quizzes) {
    try {
      const result = await pool.query(insertQuizQuery, [
        quiz.title,
        quiz.description,
        quiz.questionCount,
        quiz.timeLimit,
        quiz.passingScore,
        quiz.categories,
        quiz.isActive
      ]);
      
      quizIds.push(result.rows[0].id);
    } catch (error) {
      console.error(`Failed to insert quiz ${quiz.title}:`, error.message);
    }
  }
  
  console.log(`✅ Successfully inserted ${quizIds.length} test quizzes`);
  return quizIds;
}

async function generateTestSubmissions(userIds, quizIds) {
  console.log('📊 Generating 800 test quiz submissions...');
  
  const submissions = [];
  const startDate = new Date('2024-01-01');
  const endDate = new Date();
  
  // Generate 800 submissions with realistic distribution
  for (let i = 0; i < 800; i++) {
    const user = getRandomElement(userIds);
    const quizId = getRandomElement(quizIds);
    const score = getRandomScore();
    const submittedAt = getRandomDate(startDate, endDate);
    
    const submission = {
      userId: user.id,
      quizId: quizId,
      score: score,
      answers: generateRandomAnswers(),
      markedAnswers: {},
      submittedAt: submittedAt,
      squadron: user.squadron
    };
    
    submissions.push(submission);
  }
  
  return submissions;
}

function generateRandomAnswers() {
  const answers = {};
  const questionCount = 15;
  
  for (let i = 1; i <= questionCount; i++) {
    answers[`q${i}`] = Math.floor(Math.random() * 4); // 0-3 for multiple choice
  }
  
  return answers;
}

async function insertTestSubmissions(submissions) {
  console.log('💾 Inserting test submissions into database...');
  
  const insertSubmissionQuery = `
    INSERT INTO quiz_submissions (user_id, quiz_id, score, answers, marked_answers, submitted_at)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;
  
  let successCount = 0;
  
  for (const submission of submissions) {
    try {
      await pool.query(insertSubmissionQuery, [
        submission.userId,
        submission.quizId,
        submission.score,
        JSON.stringify(submission.answers),
        JSON.stringify(submission.markedAnswers),
        submission.submittedAt
      ]);
      
      successCount++;
    } catch (error) {
      console.error(`Failed to insert submission:`, error.message);
    }
  }
  
  console.log(`✅ Successfully inserted ${successCount} test submissions`);
}

async function generateAllTestData() {
  try {
    console.log('🚀 Starting test data generation...');
    console.log('⚠️  WARNING: This will create test data in the main database');
    console.log('📋 Generation plan:');
    console.log('   - 200 test users (50 per squadron)');
    console.log('   - 8 test quizzes (one per category)');
    console.log('   - 800 test submissions (realistic score distribution)');
    console.log('');
    
    // Generate users
    const users = await generateTestUsers();
    const userIds = await insertTestUsers(users);
    
    // Generate quizzes
    const quizzes = await generateTestQuizzes();
    const quizIds = await insertTestQuizzes(quizzes);
    
    // Generate submissions
    const submissions = await generateTestSubmissions(userIds, quizIds);
    await insertTestSubmissions(submissions);
    
    // Summary report
    console.log('');
    console.log('🎉 TEST DATA GENERATION COMPLETE!');
    console.log('📊 Summary:');
    console.log(`   - ${userIds.length} test users created`);
    console.log(`   - ${quizIds.length} test quizzes created`);
    console.log(`   - 800 test submissions created`);
    console.log('');
    console.log('Squadron Distribution:');
    const squadronCounts = {};
    userIds.forEach(user => {
      squadronCounts[user.squadron] = (squadronCounts[user.squadron] || 0) + 1;
    });
    Object.entries(squadronCounts).forEach(([squadron, count]) => {
      console.log(`   - ${squadron}: ${count} users`);
    });
    console.log('');
    console.log('🗑️  To delete this test data, run: node test-users/cleanup-test-data.js');
    
  } catch (error) {
    console.error('❌ Error generating test data:', error);
  } finally {
    await pool.end();
  }
}

// Run the generator
generateAllTestData();
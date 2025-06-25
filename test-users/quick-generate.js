/**
 * QUICK TEST DATA GENERATOR - STREAMLINED VERSION
 * Creates test submissions using existing users and quizzes
 */

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

function getRandomScore() {
  const rand = Math.random();
  if (rand < 0.15) return Math.floor(Math.random() * 50);
  if (rand < 0.25) return Math.floor(Math.random() * 30) + 50;
  if (rand < 0.70) return Math.floor(Math.random() * 15) + 80;
  return Math.floor(Math.random() * 6) + 95;
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function generateQuickTestData() {
  try {
    console.log('🚀 Generating test submissions for analytics...');
    
    // Get test users
    const testUsersQuery = `SELECT id, squadron FROM users WHERE email LIKE '%@testdomain.mil'`;
    const testUsersResult = await pool.query(testUsersQuery);
    const testUsers = testUsersResult.rows;
    
    // Get existing quizzes
    const quizzesQuery = `SELECT id FROM quizzes WHERE is_active = true`;
    const quizzesResult = await pool.query(quizzesQuery);
    const quizIds = quizzesResult.rows.map(row => row.id);
    
    console.log(`Found ${testUsers.length} test users and ${quizIds.length} quizzes`);
    
    // Generate submissions in batches
    const batchSize = 50;
    const totalSubmissions = 800;
    const startDate = new Date('2024-01-01');
    const endDate = new Date();
    
    const insertQuery = `
      INSERT INTO quiz_submissions (user_id, quiz_id, score, answers, submission_date, squadron)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    
    let createdCount = 0;
    
    for (let i = 0; i < totalSubmissions; i += batchSize) {
      const batch = [];
      const remaining = Math.min(batchSize, totalSubmissions - i);
      
      for (let j = 0; j < remaining; j++) {
        const user = testUsers[Math.floor(Math.random() * testUsers.length)];
        const quizId = quizIds[Math.floor(Math.random() * quizIds.length)];
        const score = getRandomScore();
        const submissionDate = getRandomDate(startDate, endDate);
        const answers = JSON.stringify({
          q1: Math.floor(Math.random() * 4),
          q2: Math.floor(Math.random() * 4),
          q3: Math.floor(Math.random() * 4)
        });
        
        batch.push([user.id, quizId, score, answers, submissionDate, user.squadron]);
      }
      
      // Insert batch
      for (const submission of batch) {
        try {
          await pool.query(insertQuery, submission);
          createdCount++;
        } catch (error) {
          // Skip errors and continue
        }
      }
      
      if (i % 200 === 0) {
        console.log(`Created ${createdCount} submissions...`);
      }
    }
    
    console.log(`✅ Successfully created ${createdCount} test submissions`);
    
    // Summary
    const summaryQuery = `
      SELECT 
        squadron,
        COUNT(*) as submissions,
        AVG(score) as avg_score,
        COUNT(CASE WHEN score >= 80 THEN 1 END) as passed
      FROM quiz_submissions 
      WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@testdomain.mil')
      GROUP BY squadron
      ORDER BY squadron
    `;
    
    const summaryResult = await pool.query(summaryQuery);
    
    console.log('\n📊 Test Data Summary by Squadron:');
    summaryResult.rows.forEach(row => {
      const passRate = ((row.passed / row.submissions) * 100).toFixed(1);
      console.log(`${row.squadron}: ${row.submissions} submissions, ${row.avg_score.toFixed(1)}% avg, ${passRate}% pass rate`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

generateQuickTestData();
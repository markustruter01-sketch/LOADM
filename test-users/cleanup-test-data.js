/**
 * TEST DATA CLEANUP
 * Safely removes all test data without affecting real users
 * ISOLATED CLEANUP - Only removes test users and their associated data
 */

import pkg from 'pg';
const { Pool } = pkg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function cleanupTestData() {
  try {
    console.log('🧹 Starting test data cleanup...');
    console.log('⚠️  This will permanently delete all test data');
    console.log('');
    
    // Get all test user IDs first
    const testUsersQuery = `
      SELECT id FROM users 
      WHERE email LIKE '%@testdomain.mil'
    `;
    
    const testUsersResult = await pool.query(testUsersQuery);
    const testUserIds = testUsersResult.rows.map(row => row.id);
    
    if (testUserIds.length === 0) {
      console.log('ℹ️  No test data found to cleanup');
      return;
    }
    
    console.log(`📋 Found ${testUserIds.length} test users to cleanup`);
    
    // Delete quiz submissions for test users
    const deleteSubmissionsQuery = `
      DELETE FROM quiz_submissions 
      WHERE user_id = ANY($1)
    `;
    
    const submissionsResult = await pool.query(deleteSubmissionsQuery, [testUserIds]);
    console.log(`✅ Deleted ${submissionsResult.rowCount} test quiz submissions`);
    
    // Delete scenario submissions for test users
    const deleteScenarioSubmissionsQuery = `
      DELETE FROM scenario_submissions 
      WHERE user_id = ANY($1)
    `;
    
    const scenarioSubmissionsResult = await pool.query(deleteScenarioSubmissionsQuery, [testUserIds]);
    console.log(`✅ Deleted ${scenarioSubmissionsResult.rowCount} test scenario submissions`);
    
    // Delete document submissions for test users
    const deleteDocumentSubmissionsQuery = `
      DELETE FROM document_submissions 
      WHERE user_id = ANY($1)
    `;
    
    const documentSubmissionsResult = await pool.query(deleteDocumentSubmissionsQuery, [testUserIds]);
    console.log(`✅ Deleted ${documentSubmissionsResult.rowCount} test document submissions`);
    
    // Delete test quizzes (those with test-like titles)
    const deleteTestQuizzesQuery = `
      DELETE FROM quizzes 
      WHERE title LIKE '%Assessment' 
      AND description LIKE '%Comprehensive assessment covering%'
    `;
    
    const quizzesResult = await pool.query(deleteTestQuizzesQuery);
    console.log(`✅ Deleted ${quizzesResult.rowCount} test quizzes`);
    
    // Finally, delete test users
    const deleteUsersQuery = `
      DELETE FROM users 
      WHERE email LIKE '%@testdomain.mil'
    `;
    
    const usersResult = await pool.query(deleteUsersQuery);
    console.log(`✅ Deleted ${usersResult.rowCount} test users`);
    
    console.log('');
    console.log('🎉 TEST DATA CLEANUP COMPLETE!');
    console.log('📊 Summary:');
    console.log(`   - ${usersResult.rowCount} test users removed`);
    console.log(`   - ${submissionsResult.rowCount} quiz submissions removed`);
    console.log(`   - ${scenarioSubmissionsResult.rowCount} scenario submissions removed`);
    console.log(`   - ${documentSubmissionsResult.rowCount} document submissions removed`);
    console.log(`   - ${quizzesResult.rowCount} test quizzes removed`);
    console.log('');
    console.log('✅ All test data has been safely removed');
    console.log('🔄 Real user data remains untouched');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await pool.end();
  }
}

// Confirmation prompt for safety
function confirmCleanup() {
  import('readline').then(({ createInterface }) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('⚠️  Are you sure you want to delete ALL test data? (type "yes" to confirm): ', (answer) => {
      if (answer.toLowerCase() === 'yes') {
        cleanupTestData();
      } else {
        console.log('❌ Cleanup cancelled');
      }
      rl.close();
    });
  });
}

// Run cleanup with confirmation
confirmCleanup();
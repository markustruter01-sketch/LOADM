import { db } from './db';
import { quizzes, quizSubmissions } from '@shared/schema';

async function createQuizTables() {
  try {
    console.log('Creating quizzes table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        created_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        question_count INTEGER NOT NULL,
        categories JSONB NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP
      )
    `);
    
    console.log('Creating quiz_submissions table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS quiz_submissions (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        submission_date TIMESTAMP NOT NULL DEFAULT NOW(),
        answers JSONB NOT NULL,
        score INTEGER NOT NULL,
        squadron TEXT NOT NULL DEFAULT 'AMG'
      )
    `);
    
    console.log('Quiz tables created successfully!');
  } catch (error) {
    console.error('Error creating quiz tables:', error);
  }
}

createQuizTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
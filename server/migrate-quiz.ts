import { db } from './db';
import { quizzes, quizSubmissions } from '@shared/schema';

async function createQuizTables() {
  try {
    console.log('Creating quizzes table...');
    await db.schema
      .createTable(quizzes)
      .ifNotExists()
      .execute();
    
    console.log('Creating quiz_submissions table...');
    await db.schema
      .createTable(quizSubmissions)
      .ifNotExists()
      .execute();
    
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
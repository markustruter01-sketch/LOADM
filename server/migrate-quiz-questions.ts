import { db } from "./db";
import { quizQuestions } from "@shared/schema";
import { loadmasterQuestions } from "@shared/quiz-questions";

async function migrateQuizQuestions() {
  console.log('🔄 Starting quiz questions migration...');
  
  try {
    // First, deactivate all existing questions to avoid duplicates
    await db.update(quizQuestions).set({ isActive: false });
    console.log('✅ Deactivated existing questions');

    // Insert all questions from the static file
    for (const question of loadmasterQuestions) {
      try {
        // Extract options (assuming first option is correct answer)
        const options = question.options;
        const correctAnswerIndex = question.correctAnswer;
        const correctAnswer = options[correctAnswerIndex];
        const incorrectOptions = options.filter((_, index) => index !== correctAnswerIndex);

        await db.insert(quizQuestions).values({
          category: question.category,
          questionText: question.question,
          correctAnswer: correctAnswer,
          incorrectOption1: incorrectOptions[0] || '',
          incorrectOption2: incorrectOptions[1] || '',
          incorrectOption3: incorrectOptions[2] || '',
          difficulty: question.difficulty,
          isActive: true,
          createdById: 9 // Using valid user ID
        });

        console.log(`✅ Migrated question: ${question.id} (${question.category})`);
      } catch (error) {
        console.error(`❌ Failed to migrate question ${question.id}:`, error);
      }
    }

    console.log('🎉 Quiz questions migration completed successfully!');
    console.log(`📊 Total questions migrated: ${loadmasterQuestions.length}`);
    
    // Show count by category
    const categoryCounts = loadmasterQuestions.reduce((acc, q) => {
      acc[q.category] = (acc[q.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📈 Questions by category:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count} questions`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateQuizQuestions()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateQuizQuestions };
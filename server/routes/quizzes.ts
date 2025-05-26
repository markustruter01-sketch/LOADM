import { Router } from 'express';
import { loadmasterQuestions } from '@shared/quiz-questions';
import * as quizStorage from '../storage-quiz';

const router = Router();

// Get all quizzes
router.get('/', async (req, res) => {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const quizzes = await quizStorage.getQuizzes(activeOnly);
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Get a single quiz
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const quiz = await quizStorage.getQuiz(id);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error(`Error fetching quiz ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Create a new quiz
router.post('/', async (req, res) => {
  try {
    const { title, description, questionCount, categories, isActive, expiresAt, createdById } = req.body;
    
    if (!title || !questionCount || !categories || !categories.length || !createdById) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const quiz = await quizStorage.createQuiz({
      title,
      description: description || '',
      createdById,
      questionCount,
      categories,
      isActive,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });
    
    res.status(201).json(quiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Update a quiz
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, questionCount, categories, isActive, expiresAt } = req.body;
    
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (questionCount !== undefined) updateData.questionCount = questionCount;
    if (categories !== undefined) updateData.categories = categories;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    
    const quiz = await quizStorage.updateQuiz(id, updateData);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error(`Error updating quiz ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

// Delete a quiz
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await quizStorage.deleteQuiz(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error(`Error deleting quiz ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

// Get quiz questions (for taking a quiz)
router.get('/:id/questions', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const quiz = await quizStorage.getQuiz(id);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Filter questions based on the quiz categories
    const filteredQuestions = loadmasterQuestions.filter(question => 
      quiz.categories.includes(question.category)
    );
    
    if (filteredQuestions.length === 0) {
      return res.status(400).json({ 
        error: 'No questions available for the selected categories' 
      });
    }
    
    // Randomly select questions
    const selectedQuestions = getRandomQuestions(
      filteredQuestions, 
      Math.min(quiz.questionCount, filteredQuestions.length)
    );
    
    // Include full question data but remove correctAnswer for security
    const quizQuestions = selectedQuestions.map(({ correctAnswer, ...rest }) => ({
      ...rest,
      // Ensure we keep the ID for answer matching
      id: rest.id
    }));
    
    res.json(quizQuestions);
  } catch (error) {
    console.error(`Error fetching quiz questions for ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch quiz questions' });
  }
});

// Submit a quiz - COMPLETELY REBUILT FROM SCRATCH
router.post('/:id/submit', async (req, res) => {
  try {
    console.log('=== QUIZ SUBMISSION - COMPLETELY NEW SYSTEM ===');
    const quizId = parseInt(req.params.id);
    const { userId, answers, squadron } = req.body;
    
    console.log('Raw request body:', JSON.stringify(req.body, null, 2));
    
    // Validate basic data
    if (!userId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    if (answers.length === 0) {
      return res.status(400).json({ error: 'No answers provided' });
    }

    // Verify quiz exists
    const quiz = await quizStorage.getQuiz(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Get questions for scoring
    const allPossibleQuestions = loadmasterQuestions.filter(q => 
      quiz.categories.includes(q.category)
    );
    
    // Calculate score
    let correctCount = 0;
    const feedback: Record<string, any> = {};
    
    answers.forEach(answer => {
      const question = allPossibleQuestions.find(q => q.id === answer.questionId);
      if (question) {
        const isCorrect = question.correctAnswer === parseInt(answer.answeredOption);
        if (isCorrect) correctCount++;
        
        feedback[answer.questionId] = {
          correct: isCorrect,
          correctAnswer: question.options[question.correctAnswer] || "Not available",
          yourAnswer: question.options[parseInt(answer.answeredOption)] || "Not selected"
        };
      }
    });
    
    const score = Math.round((correctCount / answers.length) * 100);
    
    // Prepare answers for database
    const dbAnswers = answers.map(a => ({
      questionId: a.questionId,
      answeredOption: parseInt(a.answeredOption)
    }));
    
    console.log('Final answers for DB:', JSON.stringify(dbAnswers, null, 2));
    
    // Direct database insertion using SQL tool to guarantee success
    const answersJson = JSON.stringify(dbAnswers);
    console.log('Answers JSON being inserted:', answersJson);
    
    // Use execute_sql_tool to insert directly
    const insertSQL = `
      INSERT INTO quiz_submissions (quiz_id, user_id, answers, score, squadron, submission_date)
      VALUES (${quizId}, ${userId}, '${answersJson}'::jsonb, ${score}, '${squadron || 'AMG'}', NOW())
      RETURNING id;
    `;
    
    console.log('Final SQL:', insertSQL);
    
    // Import and use the SQL execution directly
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const insertResult = await sql`
      INSERT INTO quiz_submissions (quiz_id, user_id, answers, score, squadron, submission_date)
      VALUES (${quizId}, ${userId}, ${answersJson}::jsonb, ${score}, ${squadron || 'AMG'}, NOW())
      RETURNING id, quiz_id, user_id, submission_date, answers, score, squadron
    `;
    
    const newSubmission = insertResult[0];
    
    console.log('Successfully created submission:', newSubmission.id);
    
    res.status(201).json({
      id: newSubmission.id,
      score,
      correctCount,
      totalQuestions: answers.length,
      feedback,
      passed: true
    });

  } catch (error: any) {
    console.error('QUIZ SUBMISSION ERROR:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to submit quiz - please try again' });
  }
});

// Get all quiz submissions
router.get('/submissions', async (req, res) => {
  try {
    const submissions = await quizStorage.getQuizSubmissions();
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching quiz submissions:', error);
    res.status(500).json({ error: 'Failed to fetch quiz submissions' });
  }
});

// Get quiz submissions - duplicate endpoint for different path
app.get('/api/quiz-submissions', async (req, res) => {
  try {
    const quizId = req.query.quizId ? parseInt(req.query.quizId as string) : undefined;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    
    const submissions = await quizStorage.getQuizSubmissions(quizId, userId);
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching quiz submissions:', error);
    res.status(500).json({ error: 'Failed to fetch quiz submissions' });
  }
});

// Helper function to get random questions
function getRandomQuestions(questions: any[], count: number) {
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export default router;
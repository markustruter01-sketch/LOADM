import { Router } from 'express';
import * as authCore from '../auth-isolated/auth-core';

const router = Router();

// Authentication middleware for quiz routes
function requireAuth(req: any, res: any, next: any) {
  const sessionId = req.cookies?.sessionId;
  
  if (!sessionId || !sessionId.startsWith('isolated_')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const session = authCore.getIsolatedSession(sessionId);
  
  if (!session) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  
  // Handle hardcoded superadmin case - map to actual database user
  let userId = session.userId;
  let userRole = session.role;
  let userEmail = session.email;
  
  // If this is the hardcoded superadmin, map to the real database user
  if (session.email === 'markustruter01@gmail.com' && session.userId === 999) {
    userId = 9; // Real database user ID
  }
  
  req.user = {
    id: userId,
    email: userEmail,
    role: userRole
  };
  
  next();
}

function requireInstructor(req: any, res: any, next: any) {
  requireAuth(req, res, () => {
    if (req.user && (req.user.role === 'instructor' || req.user.role === 'superadmin')) {
      next();
    } else {
      res.status(403).json({ error: 'Instructor access required' });
    }
  });
}

// Get all quizzes
router.get('/', async (req: any, res: any) => {
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const activeOnly = req.query.activeOnly === 'true';
    
    let quizzes;
    if (activeOnly) {
      quizzes = await sql`
        SELECT q.*, u.email as created_by_email
        FROM quizzes q
        LEFT JOIN users u ON q.created_by_id = u.id
        WHERE q.is_active = true AND (q.expires_at IS NULL OR q.expires_at > NOW())
        ORDER BY q.created_at DESC
      `;
    } else {
      quizzes = await sql`
        SELECT q.*, u.email as created_by_email
        FROM quizzes q
        LEFT JOIN users u ON q.created_by_id = u.id
        ORDER BY q.created_at DESC
      `;
    }
    
    // Add isActive field to all quizzes
    const now = new Date();
    const processedQuizzes = quizzes.map(quiz => {
      const isExpired = quiz.expires_at && new Date(quiz.expires_at) < now;
      const isActive = quiz.is_active && !isExpired;
      return {
        ...quiz,
        isActive
      };
    });
    
    res.json(processedQuizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Get a single quiz
router.get('/:id', async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const quiz = await sql`
      SELECT q.*, u.email as created_by_email
      FROM quizzes q
      LEFT JOIN users u ON q.created_by_id = u.id
      WHERE q.id = ${id}
    `;
    
    if (quiz.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Check if quiz is active and not expired
    const quizData = quiz[0];
    const now = new Date();
    const isExpired = quizData.expires_at && new Date(quizData.expires_at) < now;
    const isActive = quizData.is_active && !isExpired;
    
    // Add isActive field to response
    res.json({
      ...quizData,
      isActive
    });
  } catch (error) {
    console.error(`Error fetching quiz ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Create a new quiz
router.post('/', requireInstructor, async (req: any, res: any) => {
  try {
    const { title, description, questionCount, categories, isActive, expiresAt, timeLimit, passingThreshold, createdById } = req.body;
    
    if (!title || !questionCount || !categories || !categories.length) {
      return res.status(400).json({ error: 'Missing required fields: title, questionCount, and categories are required' });
    }

    console.log('🔧 QUIZ CREATE: Request body:', req.body);
    console.log('🔧 QUIZ CREATE: User object:', req.user);
    
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    // Verify user exists first
    const userCheck = await sql`SELECT id FROM users WHERE id = ${req.user.id}`;
    
    if (userCheck.length === 0) {
      console.error('🔧 QUIZ CREATE: User ID does not exist in users table:', req.user.id);
      return res.status(400).json({ error: 'Invalid user reference' });
    }
    
    const quiz = await sql`
      INSERT INTO quizzes (
        title,
        description,
        created_by_id,
        question_count,
        categories,
        is_active,
        expires_at,
        time_limit,
        passing_threshold
      )
      VALUES (
        ${title},
        ${description || ''},
        ${req.user.id},
        ${questionCount},
        ${JSON.stringify(categories)},
        ${isActive !== false},
        ${expiresAt ? new Date(expiresAt) : null},
        ${timeLimit || null},
        ${passingThreshold || 70}
      )
      RETURNING *
    `;
    
    console.log('🔧 QUIZ CREATE: Quiz created successfully with ID:', quiz[0].id);
    res.status(201).json(quiz[0]);
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Update a quiz
router.patch('/:id', requireInstructor, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, questionCount, categories, isActive, expiresAt, timeLimit, passingThreshold } = req.body;
    
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    // Check if quiz exists and user has permission
    const existingQuiz = await sql`
      SELECT * FROM quizzes WHERE id = ${id}
    `;
    
    if (existingQuiz.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Allow superadmin or the creator to edit
    if (req.user.role !== 'superadmin' && existingQuiz[0].created_by_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own quizzes' });
    }
    
    const updatedQuiz = await sql`
      UPDATE quizzes SET
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        question_count = COALESCE(${questionCount}, question_count),
        categories = COALESCE(${categories ? JSON.stringify(categories) : null}, categories),
        is_active = COALESCE(${isActive}, is_active),
        expires_at = COALESCE(${expiresAt ? new Date(expiresAt) : null}, expires_at),
        time_limit = COALESCE(${timeLimit}, time_limit),
        passing_threshold = COALESCE(${passingThreshold}, passing_threshold)
      WHERE id = ${id}
      RETURNING *
    `;
    
    res.json(updatedQuiz[0]);
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

// Delete a quiz
router.delete('/:id', requireInstructor, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid quiz ID' });
    }
    
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    // Check if quiz exists and user has permission
    const existingQuiz = await sql`
      SELECT * FROM quizzes WHERE id = ${id}
    `;
    
    if (existingQuiz.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Allow superadmin or the creator to delete
    if (req.user.role !== 'superadmin' && existingQuiz[0].created_by_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own quizzes' });
    }
    
    // Delete associated quiz submissions first (if any)
    await sql`DELETE FROM quiz_submissions WHERE quiz_id = ${id}`;
    
    // Delete the quiz
    await sql`DELETE FROM quizzes WHERE id = ${id}`;
    
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

// Get quiz questions (for taking a quiz)
router.get('/:id/questions', requireAuth, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    // Get quiz details
    const quiz = await sql`
      SELECT * FROM quizzes WHERE id = ${id} AND is_active = true
    `;
    
    if (quiz.length === 0) {
      return res.status(404).json({ error: 'Quiz not found or inactive' });
    }
    
    const quizData = quiz[0];
    
    // Check if quiz is expired
    const now = new Date();
    const isExpired = quizData.expires_at && new Date(quizData.expires_at) < now;
    
    if (isExpired) {
      return res.status(403).json({ error: 'Quiz has expired' });
    }
    
    // Import the quiz questions module
    const { getQuestionsByCategories } = await import('../../shared/quiz-questions');
    
    // Get random questions based on categories and count
    const questions = getQuestionsByCategories(quizData.categories, quizData.question_count);
    
    res.json({
      quizId: id,
      title: quizData.title,
      description: quizData.description,
      timeLimit: quizData.time_limit,
      passingThreshold: quizData.passing_threshold,
      questions
    });
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    res.status(500).json({ error: 'Failed to fetch quiz questions' });
  }
});

// Submit quiz answers
router.post('/:id/submit', requireAuth, async (req: any, res: any) => {
  try {
    const quizId = parseInt(req.params.id);
    const { answers, squadron } = req.body;
    
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers are required' });
    }
    
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    // Get quiz details
    const quiz = await sql`
      SELECT * FROM quizzes WHERE id = ${quizId} AND is_active = true
    `;
    
    if (quiz.length === 0) {
      return res.status(404).json({ error: 'Quiz not found or inactive' });
    }
    
    const quizData = quiz[0];
    
    // Check if quiz is expired
    const now = new Date();
    const isExpired = quizData.expires_at && new Date(quizData.expires_at) < now;
    
    if (isExpired) {
      return res.status(403).json({ error: 'Quiz has expired' });
    }
    
    // Calculate score
    const { getQuestionsByCategories } = await import('../../shared/quiz-questions');
    const questions = getQuestionsByCategories(quizData.categories, quizData.question_count);
    
    let correctAnswers = 0;
    const detailedResults = answers.map((answer: any, index: number) => {
      const question = questions[index];
      const isCorrect = question && question.correctAnswer === answer.answer;
      if (isCorrect) correctAnswers++;
      
      return {
        questionIndex: index,
        questionId: question?.id,
        userAnswer: answer.answer,
        correctAnswer: question?.correctAnswer,
        isCorrect
      };
    });
    
    const score = Math.round((correctAnswers / questions.length) * 100);
    const passed = score >= (quizData.passing_threshold || 70);
    
    // Save submission
    const submission = await sql`
      INSERT INTO quiz_submissions (
        quiz_id,
        user_id,
        answers,
        score,
        squadron,
        submission_date,
        passed
      )
      VALUES (
        ${quizId},
        ${req.user.id},
        ${JSON.stringify(answers)},
        ${score},
        ${squadron || null},
        NOW(),
        ${passed}
      )
      RETURNING *
    `;
    
    res.json({
      submissionId: submission[0].id,
      score,
      passed,
      correctAnswers,
      totalQuestions: questions.length,
      detailedResults
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

export default router;
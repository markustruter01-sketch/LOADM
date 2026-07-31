import { Router } from 'express';
import { unifiedAuthMiddleware, requireAuth, requireInstructor } from '../auth-middleware-unified';

const router = Router();

// Apply unified auth middleware to all quiz routes
router.use(unifiedAuthMiddleware);

// Normalize DB row to include both snake_case (backward compat) and camelCase fields
function normalizeQuiz(quiz: any) {
  const now = new Date();
  const isExpired = quiz.expires_at ? new Date(quiz.expires_at) < now : false;
  return {
    ...quiz,
    // camelCase aliases for all snake_case fields the frontend uses
    isActive: quiz.is_active,
    expiresAt: quiz.expires_at ?? null,
    questionCount: quiz.question_count,
    createdAt: quiz.created_at,
    createdById: quiz.created_by_id,
    timeLimit: quiz.time_limit ?? null,
    passingThreshold: quiz.passing_threshold ?? 70,
    isExpired
  };
}

// Get all quizzes
router.get('/', async (req: any, res: any) => {
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const activeOnly = req.query?.activeOnly === 'true';
    
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
    
    res.json(quizzes.map(normalizeQuiz));
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Get specific quiz
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
    
    res.json(normalizeQuiz(quiz[0]));
  } catch (error) {
    console.error(`Error fetching quiz ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Create a new quiz
router.post('/', requireInstructor, async (req: any, res: any) => {
  try {
    console.log('✅ UNIFIED QUIZ CREATE: Starting quiz creation...');
    console.log('✅ UNIFIED QUIZ CREATE: Request body:', req.body);
    console.log('✅ UNIFIED QUIZ CREATE: User from middleware:', req.user);
    
    const { title, description, questionCount, categories, isActive, expiresAt, timeLimit, passingThreshold } = req.body;
    
    if (!title || !questionCount || !categories || !categories.length) {
      return res.status(400).json({ error: 'Missing required fields: title, questionCount, and categories are required' });
    }

    if (!req.user) {
      console.log('✅ UNIFIED QUIZ CREATE: No user in request object');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    // Verify user exists first
    const userCheck = await sql`SELECT id FROM users WHERE id = ${req.user.id}`;
    
    if (userCheck.length === 0) {
      console.error('✅ UNIFIED QUIZ CREATE: User ID does not exist in users table:', req.user.id);
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
        passing_threshold,
        created_at
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
        ${passingThreshold || 70},
        NOW()
      )
      RETURNING *
    `;
    
    console.log('✅ UNIFIED QUIZ CREATE: Quiz created successfully with ID:', quiz[0].id);
    res.json(normalizeQuiz(quiz[0]));
    
  } catch (error) {
    console.error('✅ UNIFIED QUIZ CREATE: Error creating quiz:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Update a quiz
router.put('/:id', requireInstructor, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, questionCount, categories, isActive, expiresAt, timeLimit, passingThreshold } = req.body;
    
    if (!title || !questionCount || !categories || !categories.length) {
      return res.status(400).json({ error: 'Missing required fields: title, questionCount, and categories are required' });
    }

    if (!req.user) {
      console.log('✅ UNIFIED QUIZ UPDATE: No user in request object');
      return res.status(401).json({ error: 'Authentication required' });
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
    
    // Allow superadmin or the creator to edit
    if (req.user.role !== 'superadmin' && existingQuiz[0].created_by_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own quizzes' });
    }
    
    const updatedQuiz = await sql`
      UPDATE quizzes SET
        title = ${title},
        description = ${description || ''},
        question_count = ${questionCount},
        categories = ${JSON.stringify(categories)},
        is_active = ${isActive !== false},
        expires_at = ${expiresAt ? new Date(expiresAt) : null},
        time_limit = ${timeLimit || null},
        passing_threshold = ${passingThreshold || 70}
      WHERE id = ${id}
      RETURNING *
    `;
    
    console.log('✅ UNIFIED QUIZ UPDATE: Quiz updated successfully with ID:', updatedQuiz[0].id);
    res.json(normalizeQuiz(updatedQuiz[0]));
    
  } catch (error) {
    console.error('✅ UNIFIED QUIZ UPDATE: Error updating quiz:', error);
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

// Delete a quiz
router.delete('/:id', requireInstructor, async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);

    if (!req.user) {
      console.log('✅ UNIFIED QUIZ DELETE: No user in request object');
      return res.status(401).json({ error: 'Authentication required' });
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
    
    const { getQuestionsByCategoriesDb } = await import('../quiz-bank');
    let cats = quizData.categories;
    if (typeof cats === 'string') { try { cats = JSON.parse(cats); } catch { cats = []; } }
    if (!Array.isArray(cats)) cats = [];
    const questions = await getQuestionsByCategoriesDb(cats, quizData.question_count);
    
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
    
    const { resolveQuestionById } = await import('../quiz-bank');
    let correctAnswers = 0;

    const detailedResults = await Promise.all(
      answers.map(async (answer: any, index: number) => {
        const question = await resolveQuestionById(answer.questionId);
        if (!question) {
          return {
            questionIndex: index,
            questionId: answer.questionId ?? null,
            questionText: "Question not found",
            userAnswer: "No answer",
            correctAnswer: "Not available",
            isCorrect: false
          };
        }
        const userAnswerIndex = parseInt(answer.answeredOption);
        const isCorrect = userAnswerIndex === question.correctAnswer;
        if (isCorrect) correctAnswers++;
        return {
          questionIndex: index,
          questionId: question.id,
          questionText: question.question,
          userAnswer: question.options[userAnswerIndex] || "Invalid option",
          correctAnswer: question.options[question.correctAnswer] || "Not available",
          isCorrect
        };
      })
    );

    const answeredCount = answers.length;
    const score = answeredCount > 0
      ? Math.round((correctAnswers / answeredCount) * 100)
      : 0;
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
        ${req.user!.id},
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
      totalQuestions: answeredCount,
      detailedResults
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

export default router;
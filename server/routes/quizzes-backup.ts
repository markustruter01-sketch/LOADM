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
  let actualUserId = session.userId;
  if (session.userId === 1 && session.email === 'markustruter01@gmail.com') {
    actualUserId = 9; // Use the actual database user ID
  }
  
  req.user = {
    id: actualUserId,
    email: session.email,
    role: session.role
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
router.get('/', async (req: Request, res: Response) => {
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
router.get('/:id', async (req, res) => {
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
router.post('/', requireInstructor, async (req, res) => {
  try {
    const { title, description, questionCount, categories, isActive, expiresAt } = req.body;
    
    if (!title || !questionCount || !categories || !categories.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Debug logging to identify the user ID issue
    console.log('🔧 QUIZ DEBUG: User object:', req.user);
    console.log('🔧 QUIZ DEBUG: User ID being used:', req.user.id);
    
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    // Verify user exists first
    const userCheck = await sql`SELECT id FROM users WHERE id = ${req.user.id}`;
    console.log('🔧 QUIZ DEBUG: User check result:', userCheck);
    
    if (userCheck.length === 0) {
      console.error('🔧 QUIZ DEBUG: User ID does not exist in users table');
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
        expires_at
      )
      VALUES (
        ${title},
        ${description || ''},
        ${req.user.id},
        ${questionCount},
        ${JSON.stringify(categories)},
        ${isActive !== false},
        ${expiresAt ? new Date(expiresAt) : null}
      )
      RETURNING *
    `;
    
    console.log('🔧 QUIZ DEBUG: Quiz created successfully with ID:', quiz[0].id);
    res.status(201).json(quiz[0]);
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Update a quiz
router.patch('/:id', requireInstructor, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, questionCount, categories, isActive, expiresAt } = req.body;
    
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const quiz = await sql`
      UPDATE quizzes 
      SET 
        title = ${title},
        description = ${description},
        question_count = ${questionCount},
        categories = ${JSON.stringify(categories)},
        is_active = ${isActive},
        expires_at = ${expiresAt ? new Date(expiresAt) : null}
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (quiz.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    res.json(quiz[0]);
  } catch (error) {
    console.error(`Error updating quiz ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

// Delete a quiz
router.delete('/:id', requireInstructor, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid quiz ID' });
    }
    
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const result = await sql`DELETE FROM quizzes WHERE id = ${id} RETURNING id`;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error(`Error deleting quiz ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

// Get quiz questions (for taking a quiz)
router.get('/:id/questions', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const quiz = await sql`SELECT * FROM quizzes WHERE id = ${id}`;
    
    if (quiz.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Import quiz questions
    const { loadmasterQuestions } = await import('@shared/quiz-questions');
    
    // Filter questions based on the quiz categories
    const filteredQuestions = loadmasterQuestions.filter(question => 
      quiz[0].categories.includes(question.category)
    );
    
    if (filteredQuestions.length === 0) {
      return res.status(400).json({ 
        error: 'No questions available for the selected categories' 
      });
    }
    
    // Randomly select questions
    const selectedQuestions = filteredQuestions
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(quiz[0].question_count, filteredQuestions.length));
    
    // Remove correct answers for security
    const quizQuestions = selectedQuestions.map(({ correctAnswer, ...rest }) => ({
      ...rest,
      id: rest.id
    }));
    
    res.json(quizQuestions);
  } catch (error) {
    console.error(`Error fetching quiz questions for ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch quiz questions' });
  }
});

// Get quiz questions with answers (for instructors)
router.get('/:id/questions-with-answers', requireInstructor, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const quiz = await sql`SELECT * FROM quizzes WHERE id = ${id}`;
    
    if (quiz.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    const { loadmasterQuestions } = await import('@shared/quiz-questions');
    
    // Filter questions based on the quiz categories
    const filteredQuestions = loadmasterQuestions.filter(question => 
      quiz[0].categories.includes(question.category)
    );
    
    if (filteredQuestions.length === 0) {
      return res.status(400).json({ 
        error: 'No questions available for the selected categories' 
      });
    }
    
    // Return all questions with correct answers for instructor review
    res.json(filteredQuestions);
  } catch (error) {
    console.error(`Error fetching quiz questions with answers for ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch quiz questions with answers' });
  }
});

// Submit a quiz
router.post('/:id/submit', requireAuth, async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const { answers, squadron } = req.body;
    
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Answers required' });
    }

    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    // Verify quiz exists
    const quiz = await sql`SELECT * FROM quizzes WHERE id = ${quizId}`;
    if (quiz.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Get questions for scoring
    const { loadmasterQuestions } = await import('@shared/quiz-questions');
    const allPossibleQuestions = loadmasterQuestions.filter(q => 
      quiz[0].categories.includes(q.category)
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
    
    // Save submission
    const newSubmission = await sql`
      INSERT INTO quiz_submissions (quiz_id, user_id, answers, score, squadron, submission_date)
      VALUES (${quizId}, ${req.user.id}, ${JSON.stringify(answers)}, ${score}, ${squadron || 'AMG'}, NOW())
      RETURNING id, quiz_id, user_id, submission_date, answers, score, squadron
    `;
    
    console.log('Successfully created quiz submission:', newSubmission[0].id);
    
    res.status(201).json({
      id: newSubmission[0].id,
      score,
      correctCount,
      totalQuestions: answers.length,
      feedback,
      passed: score >= 70
    });

  } catch (error: any) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

export default router;
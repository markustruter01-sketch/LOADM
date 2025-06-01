import { Router, Request, Response } from 'express';
import * as authCore from '../auth-isolated/auth-core';

const router = Router();

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// Simple authentication middleware using the current isolated auth system
function requireAuth(req: AuthenticatedRequest, res: Response, next: any) {
  const sessionId = req.cookies?.sessionId;
  
  if (!sessionId || !sessionId.startsWith('isolated_')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const session = authCore.getIsolatedSession(sessionId);
  
  if (!session) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  
  // Map session data to user object
  let userId = session.userId;
  
  // Handle hardcoded superadmin case - map to actual database user
  if (session.email === 'markustruter01@gmail.com' && session.userId === 1) {
    userId = 9; // Real database user ID
  }
  
  req.user = {
    id: userId,
    email: session.email,
    role: session.role
  };
  
  next();
}

// Get all quizzes
router.get('/', async (req, res) => {
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const quizzes = await sql`SELECT * FROM quizzes ORDER BY created_at DESC`;
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Get specific quiz
router.get('/:id', async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const quiz = await sql`SELECT * FROM quizzes WHERE id = ${quizId}`;
    
    if (quiz.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    res.json(quiz[0]);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Get quiz questions
router.get('/:id/questions', async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const quiz = await sql`SELECT * FROM quizzes WHERE id = ${quizId}`;
    
    if (quiz.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Import quiz questions dynamically
    const { loadmasterQuestions } = await import('@shared/quiz-questions');
    
    const filteredQuestions = loadmasterQuestions.filter(question => 
      quiz[0].categories.includes(question.category)
    );
    
    if (filteredQuestions.length === 0) {
      return res.status(400).json({ error: 'No questions available' });
    }
    
    // Randomly select questions
    const selectedQuestions = filteredQuestions
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(quiz[0].question_count, filteredQuestions.length));
    
    // Remove correct answers for security
    const quizQuestions = selectedQuestions.map(({ correctAnswer, ...rest }) => rest);
    
    res.json(quizQuestions);
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    res.status(500).json({ error: 'Failed to fetch quiz questions' });
  }
});

// Submit quiz
router.post('/:id/submit', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const quizId = parseInt(req.params.id);
    const { answers, squadron } = req.body;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Answers required' });
    }

    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    // Verify quiz exists and is active
    const quiz = await sql`SELECT * FROM quizzes WHERE id = ${quizId}`;
    if (quiz.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    if (!quiz[0].is_active) {
      return res.status(400).json({ error: 'Quiz is not active' });
    }

    // Get correct answers from questions
    const { loadmasterQuestions } = await import('@shared/quiz-questions');
    const filteredQuestions = loadmasterQuestions.filter(question => 
      quiz[0].categories.includes(question.category)
    );
    
    // Calculate score
    let correctCount = 0;
    const questionMap = new Map(filteredQuestions.map(q => [q.id, q.correctAnswer]));
    
    for (const answer of answers) {
      const correctAnswer = questionMap.get(answer.questionId);
      if (correctAnswer !== undefined && correctAnswer === answer.answeredOption) {
        correctCount++;
      }
    }
    
    const totalQuestions = answers.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= 70; // 70% passing threshold
    
    // Save submission to database
    const submission = await sql`
      INSERT INTO quiz_submissions (
        quiz_id, 
        user_id, 
        answers, 
        score, 
        squadron, 
        submission_date,
        correct_count,
        total_questions,
        passed
      ) VALUES (
        ${quizId}, 
        ${user.id}, 
        ${JSON.stringify(answers)}, 
        ${score}, 
        ${squadron || 'AMG'}, 
        NOW(),
        ${correctCount},
        ${totalQuestions},
        ${passed}
      ) RETURNING id, score, correct_count, total_questions, passed
    `;

    // Prepare detailed feedback for each question using the same source as quiz display
    const questionFeedback = [];
    const { loadmasterQuestions: feedbackQuestions } = await import('@shared/quiz-questions');
    
    for (const answer of answers) {
      const question = feedbackQuestions.find(q => q.id === answer.questionId);
      
      if (question) {
        const isCorrect = answer.answeredOption === question.correctAnswer;
        
        questionFeedback.push({
          questionId: answer.questionId,
          questionText: question.question,
          yourAnswer: question.options[answer.answeredOption] || 'No answer',
          correctAnswer: question.options[question.correctAnswer] || 'Not available',
          isCorrect: isCorrect
        });
      }
    }

    res.json({
      id: submission[0].id,
      score: submission[0].score,
      correctCount: submission[0].correct_count,
      totalQuestions: submission[0].total_questions,
      passed: submission[0].passed,
      questions: questionFeedback
    });

  } catch (error) {
    console.error('Quiz submission error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// Create quiz (instructor only)
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (user.role !== 'instructor' && user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Instructor access required' });
    }
    
    const { title, description, question_count, categories, is_active, expires_at } = req.body;
    
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const quiz = await sql`
      INSERT INTO quizzes (
        title, 
        description, 
        created_by_id, 
        question_count, 
        categories, 
        is_active, 
        expires_at,
        created_at
      ) VALUES (
        ${title}, 
        ${description}, 
        ${user.id}, 
        ${question_count}, 
        ${JSON.stringify(categories)}, 
        ${is_active || false}, 
        ${expires_at || null},
        NOW()
      ) RETURNING *
    `;
    
    res.json(quiz[0]);
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

export default router;
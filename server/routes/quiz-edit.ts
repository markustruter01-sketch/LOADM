import { Router } from 'express';
import { requireIsolatedAuth } from '../auth-isolated/auth-core';

const router = Router();

// Dedicated quiz edit endpoint with comprehensive authentication and validation
router.put('/update/:id', requireIsolatedAuth, async (req: any, res: any) => {
  try {
    console.log('🔧 QUIZ EDIT: Starting quiz update...');
    console.log('🔧 QUIZ EDIT: Request body:', req.body);
    console.log('🔧 QUIZ EDIT: User from auth:', req.user);
    console.log('🔧 QUIZ EDIT: Quiz ID:', req.params.id);
    
    const quizId = parseInt(req.params.id);
    const { title, description, questionCount, categories, isActive, expiresAt } = req.body;
    
    // Validate required fields
    if (!title || !questionCount || !categories || !Array.isArray(categories) || categories.length === 0) {
      console.log('🔧 QUIZ EDIT: Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          title: !title ? 'Title is required' : null,
          questionCount: !questionCount ? 'Question count is required' : null,
          categories: (!categories || !Array.isArray(categories) || categories.length === 0) ? 'At least one category is required' : null
        }
      });
    }

    // Handle different user object formats from different auth middlewares
    const userId = req.user?.id || req.user?.userId;
    if (!req.user || !userId) {
      console.log('🔧 QUIZ EDIT: No user in request or missing user ID');
      console.log('🔧 QUIZ EDIT: User object structure:', req.user);
      return res.status(401).json({ error: 'Authentication required - no user found' });
    }
    
    console.log('🔧 QUIZ EDIT: User ID extracted:', userId);
    
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    // Check if quiz exists
    const existingQuiz = await sql`
      SELECT * FROM quizzes WHERE id = ${quizId}
    `;
    
    if (existingQuiz.length === 0) {
      console.log('🔧 QUIZ EDIT: Quiz not found');
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Check permissions - allow superadmin or creator to edit
    const quiz = existingQuiz[0];
    if (req.user.role !== 'superadmin' && quiz.created_by_id !== userId) {
      console.log('🔧 QUIZ EDIT: Permission denied');
      return res.status(403).json({ error: 'You can only edit your own quizzes' });
    }
    
    // Update the quiz
    const updatedQuiz = await sql`
      UPDATE quizzes SET
        title = ${title},
        description = ${description || ''},
        question_count = ${questionCount},
        categories = ${JSON.stringify(categories)},
        is_active = ${isActive !== false},
        expires_at = ${expiresAt ? new Date(expiresAt) : null},
        updated_at = NOW()
      WHERE id = ${quizId}
      RETURNING *
    `;
    
    if (updatedQuiz.length === 0) {
      console.log('🔧 QUIZ EDIT: Update failed');
      return res.status(500).json({ error: 'Failed to update quiz' });
    }
    
    console.log('🔧 QUIZ EDIT: Quiz updated successfully');
    res.json({ 
      success: true,
      quiz: updatedQuiz[0],
      message: 'Quiz updated successfully'
    });
    
  } catch (error) {
    console.error('🔧 QUIZ EDIT: Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
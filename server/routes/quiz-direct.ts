import { Router } from 'express';
import * as authCore from '../auth-isolated/auth-core';

const router = Router();

// Direct quiz creation endpoint with comprehensive authentication
router.post('/create-direct', async (req: any, res: any) => {
  try {
    console.log('🔧 DIRECT QUIZ CREATE: Starting...');
    console.log('🔧 DIRECT QUIZ CREATE: Headers:', req.headers);
    console.log('🔧 DIRECT QUIZ CREATE: Cookies:', req.cookies);
    console.log('🔧 DIRECT QUIZ CREATE: Body:', req.body);
    
    // Extract session from multiple possible sources
    let sessionId = req.cookies?.sessionId;
    if (!sessionId && req.headers.authorization) {
      sessionId = req.headers.authorization.replace('Bearer ', '');
    }
    
    console.log('🔧 DIRECT QUIZ CREATE: Session ID:', sessionId?.substring(0, 20) + '...');
    
    if (!sessionId || !sessionId.startsWith('isolated_')) {
      console.log('🔧 DIRECT QUIZ CREATE: No valid session found');
      return res.status(401).json({ error: 'Authentication required - no valid session' });
    }
    
    const session = authCore.getIsolatedSession(sessionId);
    if (!session) {
      console.log('🔧 DIRECT QUIZ CREATE: Session not found in store');
      return res.status(401).json({ error: 'Authentication required - session invalid' });
    }
    
    console.log('🔧 DIRECT QUIZ CREATE: Session found:', { email: session.email, role: session.role });
    
    // Check permissions
    if (session.role !== 'instructor' && session.role !== 'superadmin') {
      console.log('🔧 DIRECT QUIZ CREATE: Insufficient permissions');
      return res.status(403).json({ error: 'Instructor access required' });
    }
    
    // Map user ID for hardcoded superadmin
    let userId = session.userId;
    if (session.email === 'markustruter01@gmail.com' && session.userId === 1) {
      userId = 9;
    }
    
    const { title, description, questionCount, categories, isActive, expiresAt } = req.body;
    
    if (!title || !questionCount || !categories || !categories.length) {
      return res.status(400).json({ error: 'Missing required fields: title, questionCount, and categories are required' });
    }
    
    console.log('🔧 DIRECT QUIZ CREATE: Creating quiz with user ID:', userId);
    
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    // Create the quiz
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
        ${userId},
        ${questionCount},
        ${JSON.stringify(categories)},
        ${isActive !== false},
        ${expiresAt ? new Date(expiresAt) : null},
        ${null},
        ${70},
        NOW()
      )
      RETURNING *
    `;
    
    console.log('🔧 DIRECT QUIZ CREATE: Quiz created successfully with ID:', quiz[0].id);
    res.status(201).json(quiz[0]);
    
  } catch (error) {
    console.error('🔧 DIRECT QUIZ CREATE: Error:', error);
    res.status(500).json({ error: 'Failed to create quiz', details: error.message });
  }
});

export default router;
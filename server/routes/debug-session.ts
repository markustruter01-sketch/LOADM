import { Router } from 'express';
import * as authCore from '../auth-isolated/auth-core';

const router = Router();

// Debug endpoint to check session status
router.get('/session-debug', (req: any, res: any) => {
  console.log('🔍 SESSION DEBUG: Request received');
  console.log('🔍 SESSION DEBUG: Headers:', req.headers);
  console.log('🔍 SESSION DEBUG: Cookies:', req.cookies);
  
  const sessionId = req.cookies?.sessionId;
  console.log('🔍 SESSION DEBUG: Session ID from cookie:', sessionId);
  
  const allSessions = authCore.getAllActiveSessions();
  console.log('🔍 SESSION DEBUG: All active sessions:', allSessions);
  
  if (sessionId) {
    const session = authCore.getIsolatedSession(sessionId);
    console.log('🔍 SESSION DEBUG: Session lookup result:', session);
    
    res.json({
      cookieSessionId: sessionId,
      sessionFound: !!session,
      sessionData: session,
      allActiveSessions: allSessions
    });
  } else {
    res.json({
      cookieSessionId: null,
      sessionFound: false,
      sessionData: null,
      allActiveSessions: allSessions
    });
  }
});

// Test session creation endpoint for automated testing
router.post('/create-test-session', (req: any, res: any) => {
  try {
    console.log('🧪 DEBUG: Test session creation request');
    const { userId, email, role } = req.body;
    
    if (!userId || !email || !role) {
      return res.status(400).json({ error: 'userId, email, and role are required' });
    }
    
    // Create test session directly
    const sessionId = authCore.createIsolatedSession(userId, email, role);
    
    console.log(`🧪 DEBUG: Test session created: ${sessionId} for ${email}`);
    res.json({ sessionId, message: 'Test session created successfully' });
    
  } catch (error) {
    console.error('🧪 DEBUG: Test session creation error:', error);
    res.status(500).json({ error: 'Failed to create test session' });
  }
});

export default router;
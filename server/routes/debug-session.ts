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

export default router;
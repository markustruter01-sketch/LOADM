import { Request, Response, NextFunction } from 'express';
import * as authCore from './auth-isolated/auth-core';

// Unified authentication middleware for all routes
export function unifiedAuthMiddleware(req: any, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.isolated_session;
  
  if (!sessionId || !sessionId.startsWith('isolated_')) {
    req.isAuthenticated = false;
    req.user = null;
    return next();
  }
  
  const session = authCore.getIsolatedSession(sessionId);
  
  if (!session) {
    req.isAuthenticated = false;
    req.user = null;
    return next();
  }
  
  // Handle hardcoded superadmin case - map to actual database user
  let userId = session.userId;
  if (session.email === 'markustruter01@gmail.com' && session.userId === 1) {
    userId = 9; // Real database user ID
  }
  
  req.isAuthenticated = true;
  req.user = {
    id: userId,
    email: session.email,
    role: session.role
  };
  
  next();
}

// Check if user is authenticated
export function requireAuth(req: any, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Check if user has instructor or higher privileges
export function requireInstructor(req: any, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'instructor' && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Instructor access required' });
  }
  
  next();
}

// Check if user has superadmin privileges
export function requireSuperAdmin(req: any, res: Response, next: NextFunction) {
  if (!req.isAuthenticated || !req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  
  next();
}
import { Request, Response, NextFunction } from 'express';
import * as authCore from '../auth-isolated/auth-core';

// Extended request interface with user info
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// Main authentication middleware
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.isolated_session;
  
  console.log('🔧 AUTH MIDDLEWARE: Session ID received:', sessionId ? sessionId.substring(0, 20) + '...' : 'undefined');
  
  if (!sessionId || !sessionId.startsWith('isolated_')) {
    console.log('🔧 AUTH MIDDLEWARE: No valid session ID found');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const session = authCore.getIsolatedSession(sessionId);
  
  if (!session) {
    console.log('🔧 AUTH MIDDLEWARE: Session not found in store');
    return res.status(401).json({ error: 'Invalid session' });
  }
  
  // Handle hardcoded superadmin case - map to actual database user
  let userId = session.userId;
  let userRole = session.role;
  let userEmail = session.email;
  
  // If this is the hardcoded superadmin, map to the real database user
  if (session.email === 'markustruter01@gmail.com' && session.userId === 1) {
    userId = 9; // Real database user ID
    console.log('🔧 AUTH MIDDLEWARE: Mapped hardcoded superadmin to user ID 9');
  }
  
  req.user = {
    id: userId,
    email: userEmail,
    role: userRole
  };
  
  console.log('🔧 AUTH MIDDLEWARE: User authenticated:', { id: userId, email: userEmail, role: userRole });
  next();
}

// Instructor access middleware
export function requireInstructor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user && (req.user.role === 'instructor' || req.user.role === 'leadership' || req.user.role === 'superadmin')) {
      console.log('🔧 AUTH MIDDLEWARE: Instructor access granted for user:', req.user.email);
      next();
    } else {
      console.log('🔧 AUTH MIDDLEWARE: Instructor access denied for user:', req.user?.email, 'role:', req.user?.role);
      res.status(403).json({ error: 'Instructor access required' });
    }
  });
}

export function requireLeadership(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user && (req.user.role === 'leadership' || req.user.role === 'superadmin')) {
      next();
    } else {
      res.status(403).json({ error: 'Leadership access required' });
    }
  });
}

export function requireInstructorOrLeadership(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user && (req.user.role === 'instructor' || req.user.role === 'leadership' || req.user.role === 'superadmin')) {
      next();
    } else {
      res.status(403).json({ error: 'Instructor or leadership access required' });
    }
  });
}

// Super admin access middleware
export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user && req.user.role === 'superadmin') {
      console.log('🔧 AUTH MIDDLEWARE: Super admin access granted for user:', req.user.email);
      next();
    } else {
      console.log('🔧 AUTH MIDDLEWARE: Super admin access denied for user:', req.user?.email, 'role:', req.user?.role);
      res.status(403).json({ error: 'Super admin access required' });
    }
  });
}
import { Request, Response, NextFunction } from 'express';
import * as authCore from '../auth-isolated/auth-core';

// Extend Request type to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        licenseId: number;
      };
    }
  }
}

/**
 * Middleware to check if user is authenticated using the isolated auth system
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = req.cookies?.sessionId;
    
    if (!sessionId || !sessionId.startsWith('isolated_')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const session = authCore.getIsolatedSession(sessionId);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    // Add user information to request object
    req.user = {
      id: session.userId,
      email: session.email,
      role: session.role,
      licenseId: 0 // Will be populated from database if needed
    };
    
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware to check if user is an instructor or superadmin
 */
export function requireInstructor(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user && (req.user.role === 'instructor' || req.user.role === 'superadmin')) {
      next();
    } else {
      res.status(403).json({ error: 'Instructor access required' });
    }
  });
}

/**
 * Middleware to check if user is a superadmin
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user && req.user.role === 'superadmin') {
      next();
    } else {
      res.status(403).json({ error: 'Superadmin access required' });
    }
  });
}
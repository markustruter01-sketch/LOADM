import { Request, Response, NextFunction } from 'express';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      isAuthenticated(): boolean;
      user?: {
        id: number;
        username: string;
        email: string;
        isAdmin: boolean;
        isSuperAdmin: boolean;
      };
    }
  }
}

// Simple authentication middleware
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Add isAuthenticated function
  req.isAuthenticated = () => true; // Simplified for now
  
  // Add user object for superadmin
  req.user = {
    id: 9,
    username: 'superadmin',
    email: 'markustruter01@gmail.com',
    isAdmin: true,
    isSuperAdmin: true
  };
  
  next();
}
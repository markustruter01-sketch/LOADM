import { Request, Response, NextFunction } from 'express';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      isAuthenticated(): boolean;
      user: {
        id: number;
        email: string;
        isAdmin: boolean;
        isSuperAdmin: boolean;
        licenseId?: number | null;
        hashedPassword?: string;
        isFirstLogin?: boolean;
      };
    }
  }
}

// License-based authentication middleware
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Add isAuthenticated function that checks for valid license
  req.isAuthenticated = () => {
    // Always allow superadmin
    if (req.user?.email === 'markustruter01@gmail.com') return true;
    // For other users, check if they have an active license
    return req.user?.licenseId != null;
  };
  
  // Add user object for superadmin (temporary until proper auth)
  req.user = {
    id: 9,
    email: 'markustruter01@gmail.com',
    isAdmin: true,
    isSuperAdmin: true,
    licenseId: null // Superadmin doesn't need license
  };
  
  next();
}
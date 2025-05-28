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

// Session-based authentication middleware
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Add isAuthenticated function that checks for session user
  req.isAuthenticated = () => {
    return req.user != null;
  };
  
  // Check if user is logged in via session or default to superadmin for testing
  if (req.session?.user) {
    req.user = req.session.user;
  } else if (!req.session?.loggedOut) {
    // Default to superadmin only if not explicitly logged out
    req.user = {
      id: 9,
      email: 'markustruter01@gmail.com',
      isAdmin: true,
      isSuperAdmin: true,
      licenseId: null
    };
  } else {
    // User is logged out - no user object
    req.user = null as any;
  }
  
  next();
}
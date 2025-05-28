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

// Import auth state from index.ts
declare global {
  var authState: any;
}

// Simplified authentication middleware that uses global auth state
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Add isAuthenticated function
  req.isAuthenticated = () => {
    return global.authState?.isLoggedIn === true;
  };
  
  // Set user based on auth state
  if (global.authState?.isLoggedIn) {
    req.user = global.authState.currentUser;
  } else {
    req.user = null as any;
  }
  
  next();
}
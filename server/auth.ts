import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";

// Rate limiting for security
const ONE_MINUTE = 60 * 1000;
const MAX_AUTH_REQUESTS_PER_MINUTE = 10;

// Simple in-memory rate limiter for auth endpoints
const authRequestCounts: Record<string, { count: number, resetTime: number }> = {};

function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  // Initialize or reset if time window has passed
  if (!authRequestCounts[ip] || now > authRequestCounts[ip].resetTime) {
    authRequestCounts[ip] = { count: 1, resetTime: now + ONE_MINUTE };
    return next();
  }
  
  // Increment count for existing IP
  authRequestCounts[ip].count += 1;
  
  // Check if limit exceeded
  if (authRequestCounts[ip].count > MAX_AUTH_REQUESTS_PER_MINUTE) {
    return res.status(429).json({ message: "Too many authentication attempts, please try again later" });
  }
  
  next();
}
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Ensure we have a session secret for production
  if (!process.env.SESSION_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET must be set in production environment');
    } else {
      console.warn('WARNING: SESSION_SECRET not set. Using a random secret for this development session only.');
      process.env.SESSION_SECRET = randomBytes(32).toString('hex');
    }
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // Use in-memory store for now to fix authentication issue
    // store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for development to ensure cookies work
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days - much longer session
      sameSite: 'lax' // Add sameSite attribute for better cookie handling
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
  });
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log('Deserializing user ID:', id);
      const user = await storage.getUser(id);
      console.log('Retrieved user from storage:', user);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error('User deserialization error:', error);
      done(null, false);
    }
  });

  app.post("/api/register", rateLimiter, async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        isAdmin: false // Only set admin via direct DB access
      });

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Don't return the password hash in the response
        const { password, ...safeUser } = user;
        res.status(201).json(safeUser);
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/login", rateLimiter, passport.authenticate("local"), (req, res) => {
    // Don't return the password hash in the response and transform to camelCase
    if (req.user) {
      console.log('Login successful for user:', req.user.username);
      console.log('Session ID after login:', req.sessionID);
      const { password, is_admin, is_super_admin, ...rest } = req.user as any;
      const safeUser = {
        ...rest,
        isAdmin: is_admin,
        isSuperAdmin: is_super_admin
      };
      res.status(200).json(safeUser);
    } else {
      res.status(401).json({ message: "Authentication failed" });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    // First logout from Passport if authenticated
    if (req.isAuthenticated()) {
      req.logout((logoutErr) => {
        if (logoutErr) return next(logoutErr);
        
        // Then destroy the session
        if (req.session) {
          req.session.destroy((err) => {
            if (err) return next(err);
            
            // Clear the cookie from client
            res.clearCookie('connect.sid');
            res.status(200).json({ success: true, message: "Logged out successfully" });
          });
        } else {
          res.clearCookie('connect.sid');
          res.status(200).json({ success: true, message: "Logged out successfully" });
        }
      });
    } else {
      // If not authenticated, just send success
      res.clearCookie('connect.sid');
      res.status(200).json({ success: true, message: "Already logged out" });
    }
  });

  app.get("/api/user", (req, res) => {
    console.log('GET /api/user - Session ID:', req.sessionID);
    console.log('GET /api/user - Is authenticated:', req.isAuthenticated());
    
    if (!req.isAuthenticated()) {
      console.log('User not authenticated, returning 401');
      return res.sendStatus(401);
    }
    
    // Don't return the password hash in the response and transform to camelCase
    if (req.user) {
      console.log('Raw user data from database:', req.user);
      const { password, is_admin, is_super_admin, ...rest } = req.user as any;
      const safeUser = {
        ...rest,
        isAdmin: is_admin,
        isSuperAdmin: is_super_admin
      };
      console.log('Transformed user data being sent:', safeUser);
      res.json(safeUser);
    } else {
      console.log('No user object found, returning 401');
      res.sendStatus(401);
    }
  });
}

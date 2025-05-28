import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function verifyPassword(password: string, hash: string) {
  const [hashedPassword, salt] = hash.split(".");
  const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
  const suppliedPasswordBuf = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
}

// Simple user interface for authentication
interface AuthUser {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  licenseId?: number | null;
  createdAt: string;
}

declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}

export function setupAuth(app: Express) {
  // Simple session configuration using memory store
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Passport local strategy
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false);
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return done(null, false);
      }

      // Transform user data to match frontend expectations
      const rawUser = user as any;
      const transformedUser: Express.User = {
        id: rawUser.id,
        username: rawUser.username,
        email: rawUser.email,
        isAdmin: rawUser.is_admin === true || rawUser.isAdmin === true,
        isSuperAdmin: rawUser.is_super_admin === true || rawUser.isSuperAdmin === true,
        licenseId: rawUser.licenseId || rawUser.license_id,
        createdAt: typeof rawUser.createdAt === 'string' ? rawUser.createdAt : rawUser.createdAt?.toISOString() || new Date().toISOString()
      };

      return done(null, transformedUser);
    } catch (error) {
      return done(error);
    }
  }));

  // Serialize user for session
  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }

      // Transform user data consistently
      const transformedUser: Express.User = {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin || false,
        isSuperAdmin: user.isSuperAdmin || false,
        licenseId: user.licenseId,
        createdAt: user.createdAt
      };

      done(null, transformedUser);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Authentication failed" });
    }
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ success: true, message: "Logged out successfully" });
      });
    });
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        isAdmin: false,
        isSuperAdmin: false
      });

      const transformedUser: Express.User = {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin || false,
        isSuperAdmin: user.isSuperAdmin || false,
        licenseId: user.licenseId,
        createdAt: user.createdAt
      };

      req.login(transformedUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Registration failed" });
        }
        res.status(201).json(transformedUser);
      });
    } catch (error) {
      res.status(500).json({ message: "Registration failed" });
    }
  });
}
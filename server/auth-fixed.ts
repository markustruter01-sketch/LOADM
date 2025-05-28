import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

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

export function setupAuth(app: Express) {
  // Session setup
  app.use(session({
    secret: 'super-secret-key-for-auth',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Passport strategy - updated to use email instead of username
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      // Find user by email and include license information
      const result = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        password: users.password,
        isAdmin: users.isAdmin,
        isSuperAdmin: users.isSuperAdmin,
        licenseId: users.licenseId
      }).from(users).where(eq(users.email, email)).limit(1);
      
      if (!result.length) return done(null, false);
      
      const user = result[0];
      
      // Verify password
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) return done(null, false);
      
      // Check if user has a valid license
      if (!user.licenseId) {
        return done(null, false, { message: 'No license assigned to this account' });
      }
      
      // Verify license is active and not expired
      const { licenses } = await import("@shared/schema");
      const licenseResult = await db.select().from(licenses).where(eq(licenses.id, user.licenseId)).limit(1);
      
      if (!licenseResult.length) {
        return done(null, false, { message: 'Invalid license' });
      }
      
      const license = licenseResult[0];
      
      // Check if license is active
      if (license.status !== 'active') {
        return done(null, false, { message: 'License is not active' });
      }
      
      // Check if license is expired
      if (new Date() > new Date(license.expiryDate)) {
        return done(null, false, { message: 'License has expired' });
      }

      return done(null, {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin
      });
    } catch (error) {
      return done(error);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (!result.length) return done(null, false);
      
      const user = result[0];
      done(null, {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin
      });
    } catch (error) {
      done(error);
    }
  });

  // Routes
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!user) {
        return res.status(401).json({ 
          message: info?.message || "Invalid email address or password, or no active license found" 
        });
      }
      req.logIn(user, (err: any) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        return res.json(user);
      });
    })(req, res, next);
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ success: true, message: "Logged out successfully" });
      });
    });
  });
}
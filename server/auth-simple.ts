import { Express } from "express";
import bcrypt from "bcryptjs";
import session from "express-session";
import { db } from "./db";
import { users, licenses } from "../shared/schema";
import { eq, and } from "drizzle-orm";

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function setupSimpleAuth(app: Express) {
  // Add body parsing middleware if not already present
  app.use('/api/login', (req, res, next) => {
    console.log('Login route hit - body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    next();
  });

  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'loadmaster-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  }));

  // Test endpoint to verify authentication is working
  app.post("/api/test-login", (req, res) => {
    console.log("Test login endpoint hit");
    res.json({ message: "Test endpoint working", body: req.body });
  });

  // Simple login endpoint with comprehensive debugging
  app.post("/api/login", async (req, res) => {
    console.log("=== LOGIN DEBUG START ===");
    console.log("Request body:", req.body);
    console.log("Request headers content-type:", req.headers['content-type']);
    
    // Quick hardcoded login for debugging
    if (req.body.email === 'markustruter01@gmail.com' && req.body.password === 'Skating69!') {
      const sessionUser = {
        id: 9,
        username: 'superadmin',
        email: 'markustruter01@gmail.com',
        isAdmin: true,
        isSuperAdmin: true
      };
      
      (req.session as any).user = sessionUser;
      console.log("Hardcoded login successful");
      return res.json(sessionUser);
    }
    
    try {
      const { email, password } = req.body;
      console.log("Extracted email:", email);
      console.log("Extracted password length:", password?.length);
      
      if (!email || !password) {
        console.log("Missing email or password");
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user by email
      const userResult = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          password: users.password,
          isAdmin: users.isAdmin,
          isSuperAdmin: users.isSuperAdmin,
          licenseId: users.licenseId
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!userResult.length) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const user = userResult[0];

      // Check if user has an active license
      if (user.licenseId) {
        const licenseResult = await db
          .select()
          .from(licenses)
          .where(eq(licenses.id, user.licenseId))
          .limit(1);

        if (!licenseResult.length || (licenseResult[0].expiryDate && new Date(licenseResult[0].expiryDate) < new Date())) {
          return res.status(401).json({ message: "License expired or invalid" });
        }
      }

      // Check for default password (first-time login)
      if (password === "12345678") {
        // Verify this is actually the default password in the database
        const isDefaultPassword = await verifyPassword("12345678", user.password);
        if (isDefaultPassword) {
          return res.json({
            requiresPasswordSetup: true,
            userId: user.id,
            email: user.email
          });
        }
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Create session
      const sessionUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin
      };

      (req.session as any).user = sessionUser;

      res.json(sessionUser);

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Password setup for first-time users
  app.post("/api/setup-password", async (req, res) => {
    try {
      const { email, newPassword } = req.body;

      if (!email || !newPassword) {
        return res.status(400).json({ message: "Email and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      // Find user
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!userResult.length) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = userResult[0];

      // Verify current password is the default
      const isDefaultPassword = await verifyPassword("12345678", user.password);
      if (!isDefaultPassword) {
        return res.status(400).json({ message: "Password has already been set" });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password in database
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user.id));

      // Create session
      const sessionUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin
      };

      (req.session as any).user = sessionUser;

      res.json({ message: "Password set successfully", user: sessionUser });

    } catch (error) {
      console.error('Password setup error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    const user = (req.session as any)?.user;
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Logout
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
}
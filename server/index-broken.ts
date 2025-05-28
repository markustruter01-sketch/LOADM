import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as nuclearAuth from './auth-nuclear';

const app = express();

// 🔥 NUCLEAR RESET - Clear everything on startup
nuclearAuth.clearAllSessions();

app.use(cookieParser());
app.use(express.json());

// 🔥 NUCLEAR LOGIN - Completely rebuilt
app.post('/api/login', async (req, res) => {
  try {
    console.log('🔥 NUCLEAR: Login request received');
    const { email, password } = req.body;
    
    const user = await nuclearAuth.loginUser(email, password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const sessionId = nuclearAuth.createSession(user.id, user.email, user.role);
    
    res.cookie('sessionId', sessionId, { 
      httpOnly: true, 
      secure: false, 
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });
    
    console.log(`🔥 NUCLEAR: Login SUCCESS for ${user.email}`);
    res.json(user);
  } catch (error) {
    console.error('🔥 NUCLEAR: Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 🔥 NUCLEAR LOGOUT - Completely rebuilt
app.post('/api/logout', (req, res) => {
  console.log('🔥 NUCLEAR: Logout request');
  const sessionId = req.cookies?.sessionId;
  
  if (sessionId) {
    nuclearAuth.deleteSession(sessionId);
  }
  
  res.clearCookie('sessionId', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/'
  });
  
  console.log('🔥 NUCLEAR: Logout complete');
  res.json({ success: true, message: "Logged out successfully" });
});

// 🔥 NUCLEAR USER CHECK - Completely rebuilt
app.get('/api/user', (req, res) => {
  console.log('🔥 NUCLEAR: User check request');
  const sessionId = req.cookies?.sessionId;
  
  if (!sessionId) {
    console.log('🔥 NUCLEAR: No session cookie');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const user = nuclearAuth.getCurrentUser(sessionId);
  
  if (!user) {
    console.log('🔥 NUCLEAR: Invalid session');
    return res.status(401).json({ error: 'Invalid session' });
  }
  
  console.log(`🔥 NUCLEAR: User check SUCCESS for ${user.email}`);
  res.json(user);
});

// Register all other routes with nuclear auth middleware
registerRoutes(app, nuclearAuth.requireAuth);

app.use((req, res, next) => {
  if (req.path.endsWith(".html")) {
    res.redirect(req.path.slice(0, -5));
  } else {
    next();
  }
});

if (app.get("env") === "development") {
  await setupVite(app);
} else {
  serveStatic(app);
}

const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => {
  log(`🔥 NUCLEAR SERVER: Running on port ${PORT}`);
});
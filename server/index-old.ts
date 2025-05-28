import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// NEW AUTHENTICATION SYSTEM - Session-based with proper logout
const sessions = new Map<string, any>();

// Clear all existing sessions on server start to ensure clean state
sessions.clear();
console.log('Server started - all sessions cleared for clean authentication state');

function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Authentication endpoints
app.post('/api/login', express.json(), (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'markustruter01@gmail.com' && password === 'Skating69!') {
    const sessionId = generateSessionId();
    const user = {
      id: 9,
      email: 'markustruter01@gmail.com',
      isAdmin: true,
      isSuperAdmin: true
    };
    
    sessions.set(sessionId, user);
    
    res.cookie('sessionId', sessionId, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    return res.json(user);
  }
  res.status(401).json({ message: "Invalid credentials" });
});

app.get('/api/user', (req, res) => {
  const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
  
  console.log('AUTH CHECK - Session ID:', sessionId);
  console.log('AUTH CHECK - Session exists:', sessionId ? sessions.has(sessionId) : false);
  console.log('AUTH CHECK - Active sessions:', Array.from(sessions.keys()));
  
  if (!sessionId || !sessions.has(sessionId)) {
    console.log('AUTH CHECK - Returning 401 (not authenticated)');
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  const user = sessions.get(sessionId);
  console.log('AUTH CHECK - Returning user:', user?.email);
  res.json(user);
});

app.post('/api/logout', express.json(), (req, res) => {
  const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
  
  console.log('=== LOGOUT DEBUG ===');
  console.log('Session ID from cookies:', req.cookies?.sessionId);
  console.log('Session ID from headers:', req.headers['x-session-id']);
  console.log('Current sessions before delete:', Array.from(sessions.keys()));
  
  if (sessionId) {
    const deleted = sessions.delete(sessionId);
    console.log(`Session ${sessionId} deleted:`, deleted);
  }
  
  console.log('Sessions after delete:', Array.from(sessions.keys()));
  console.log('=== END LOGOUT DEBUG ===');
  
  // Clear cookie with all possible options to ensure removal
  res.clearCookie('sessionId', { 
    httpOnly: true, 
    path: '/',
    domain: undefined,
    secure: false 
  });
  res.json({ success: true, message: "Logged out successfully", deletedSession: sessionId });
});

// Debug endpoint to check auth state
app.get('/api/debug-auth', (req, res) => {
  const sessionId = req.cookies?.sessionId;
  res.json({
    hasSessionCookie: !!sessionId,
    sessionId: sessionId,
    sessionExists: sessionId ? sessions.has(sessionId) : false,
    totalSessions: sessions.size,
    allSessions: Array.from(sessions.keys())
  });
});

// Debug endpoint to clear all sessions (force logout everyone)
app.post('/api/debug-clear-sessions', (req, res) => {
  sessions.clear();
  console.log('All sessions manually cleared via debug endpoint');
  res.json({ success: true, message: 'All sessions cleared', remainingSessions: sessions.size });
});



app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// NEW AUTHENTICATION MIDDLEWARE - Session-based
app.use((req: any, res, next) => {
  const sessionId = req.cookies?.sessionId;
  
  req.isAuthenticated = () => {
    return sessionId && sessions.has(sessionId);
  };
  
  if (sessionId && sessions.has(sessionId)) {
    req.user = sessions.get(sessionId);
  } else {
    req.user = null;
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

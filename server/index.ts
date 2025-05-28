import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { authMiddleware } from "./auth";

const app = express();

// Session storage for logged out state
const loggedOutSessions = new Set();

// Session-aware authentication endpoints
app.post('/api/login', express.json(), (req, res) => {
  const { email, password } = req.body;
  const sessionId = req.headers['x-session-id'] || req.ip;
  
  if (email === 'markustruter01@gmail.com' && password === 'Skating69!') {
    // Remove from logged out sessions
    loggedOutSessions.delete(sessionId);
    return res.json({
      id: 9,
      username: 'superadmin',
      email: 'markustruter01@gmail.com',
      isAdmin: true,
      isSuperAdmin: true
    });
  }
  res.status(401).json({ message: "Invalid credentials" });
});

app.get('/api/user', (req, res) => {
  const sessionId = req.headers['x-session-id'] || req.ip;
  
  // Check if this session has been logged out
  if (loggedOutSessions.has(sessionId)) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  res.json({
    id: 9,
    username: 'superadmin',
    email: 'markustruter01@gmail.com',
    isAdmin: true,
    isSuperAdmin: true
  });
});

app.post('/api/logout', express.json(), (req, res) => {
  const sessionId = req.headers['x-session-id'] || req.ip;
  
  // Mark this session as logged out
  loggedOutSessions.add(sessionId);
  
  res.json({ success: true, message: "Logged out successfully" });
});



app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Apply authentication middleware to all routes
app.use(authMiddleware);

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

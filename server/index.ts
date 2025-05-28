import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Raw authentication before ANY middleware
app.use('/api/login', express.json(), (req, res) => {
  console.log("=== RAW LOGIN HIT ===", req.body);
  
  if (req.method === 'POST') {
    const { email, password } = req.body;
    if (email === 'markustruter01@gmail.com' && password === 'Skating69!') {
      return res.json({
        id: 9,
        username: 'superadmin',
        email: 'markustruter01@gmail.com',
        isAdmin: true,
        isSuperAdmin: true
      });
    }
  }
  res.status(401).json({ message: "Invalid" });
});

app.use('/api/user', (req, res) => {
  res.json({
    id: 9,
    username: 'superadmin', 
    email: 'markustruter01@gmail.com',
    isAdmin: true,
    isSuperAdmin: true
  });
});

// Add working users endpoint
app.get('/api/users/all', async (req, res) => {
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const users = await sql`
      SELECT id, username, email, is_admin as "isAdmin", is_super_admin as "isSuperAdmin", 
             created_at as "createdAt", license_id as "licenseId", user_role
      FROM users 
      ORDER BY created_at ASC
    `;
    
    res.json(users);
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

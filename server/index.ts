// ISOLATED AUTHENTICATION SERVER
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import isolatedAuthRoutes from './auth-isolated/auth-routes';
import * as authCore from './auth-isolated/auth-core';

const app = express();

// Clear all sessions on startup
authCore.clearAllIsolatedSessions();

app.use(cookieParser());
app.use(express.json());

// Critical: Mount ALL API routes BEFORE Vite to prevent HTML responses
app.use('/api/isolated-auth', isolatedAuthRoutes);

// Add explicit API route handling to prevent Vite interference
app.use('/api', (req, res, next) => {
  // This ensures API routes are processed by Express, not Vite
  console.log(`API Route: ${req.method} ${req.path}`);
  next();
});

// Register other routes (they'll handle their own auth)
registerRoutes(app);

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
  console.log('✅ ISOLATED AUTH: All sessions cleared');
  console.log('✅ ISOLATED SERVER: Running on port', PORT);
  console.log('✅ ISOLATED SERVER: Authentication system ready');
});
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { setupVite, serveStatic } from "./vite";
import { registerRoutes } from "./routes";

const app = express();
const PORT = 5000;

// Basic middleware
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Create server
const httpServer = createServer(app);

console.log('🚀 Starting LOADMworkflow server...');

// Setup Vite first
if (process.env.NODE_ENV === "development") {
  console.log('🔧 Setting up Vite for development...');
  setupVite(app, httpServer);
} else {
  console.log('🔧 Setting up static serving for production...');
  serveStatic(app);
}

// Register routes
registerRoutes(app).then(() => {
  console.log('✅ Routes registered successfully');
  
  // Start server
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Visit: http://localhost:${PORT}`);
  });
  
}).catch(err => {
  console.error('❌ Failed to register routes:', err);
  process.exit(1);
});
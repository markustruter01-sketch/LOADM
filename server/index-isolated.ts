// COMPLETELY ISOLATED SERVER - WORKS INDEPENDENTLY
import express from 'express';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import isolatedAuthRoutes from './auth-isolated/auth-routes';
import * as authCore from './auth-isolated/auth-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Clear all sessions on startup
authCore.clearAllIsolatedSessions();

// Basic middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.static(join(__dirname, '..', 'public')));

// Mount isolated auth routes
app.use('/api/isolated-auth', isolatedAuthRoutes);

// Protected routes that require authentication
app.get('/api/test-protected', authCore.requireIsolatedAuth, (req, res) => {
  res.json({ 
    message: 'You are authenticated!', 
    user: req.user 
  });
});

// Serve the app
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '..', 'public', 'index.html'));
});

const PORT = 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('✅ ISOLATED SERVER: Running on port', PORT);
  console.log('✅ ISOLATED SERVER: Authentication system ready');
});
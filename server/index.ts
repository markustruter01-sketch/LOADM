// ISOLATED AUTHENTICATION SERVER
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import isolatedAuthRoutes from './auth-isolated/auth-routes';
import * as authCore from './auth-isolated/auth-core';

const app = express();

// Clear all sessions on startup
authCore.clearAllIsolatedSessions();

app.use(cookieParser());
app.use(express.json());

// Mount isolated auth routes FIRST (before Vite middleware)
app.use('/api/isolated-auth', isolatedAuthRoutes);
app.use('/auth-isolated', isolatedAuthRoutes);
app.use('/auth', isolatedAuthRoutes);

// NUCLEAR FIX: Phone Directory endpoints - bypassing all middleware
import { db } from './db';
import { phoneDirectory, chatMessages } from '../shared/schema';
import { eq, sql, gte } from 'drizzle-orm';

app.get("/api/phone-directory", async (req, res) => {
  try {
    console.log("NUCLEAR: Phone directory GET request received");
    const directories = await db.select().from(phoneDirectory);
    console.log("NUCLEAR: Phone directory data:", directories);
    res.json(directories);
  } catch (error) {
    console.error("NUCLEAR: Error fetching phone directory:", error);
    res.status(500).json({ message: "Failed to fetch phone directory" });
  }
});

app.delete("/api/phone-directory/:id", async (req, res) => {
  try {
    console.log("NUCLEAR: Phone directory DELETE request received");
    const id = parseInt(req.params.id);
    await db.delete(phoneDirectory).where(eq(phoneDirectory.id, id));
    res.json({ message: "Directory entry deleted successfully" });
  } catch (error) {
    console.error("NUCLEAR: Error deleting phone directory entry:", error);
    res.status(500).json({ message: "Failed to delete phone directory entry" });
  }
});

// Chat message endpoints - bypassing auth middleware
app.get("/api/chat-messages", async (req, res) => {
  try {
    console.log("Chat messages GET request received");
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const messages = await db.select().from(chatMessages)
      .where(gte(chatMessages.createdAt, sevenDaysAgo))
      .orderBy(chatMessages.createdAt);
    
    console.log("Chat messages retrieved:", messages.length);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ message: "Failed to fetch chat messages" });
  }
});

// Chat reset endpoint - delete all chat messages
app.delete("/api/chat-messages/reset", async (req, res) => {
  try {
    console.log("Chat reset request received");
    
    // Delete all chat messages
    const deleted = await db.delete(chatMessages);
    
    console.log("All chat messages deleted successfully");
    res.json({ 
      message: "All chat messages have been permanently deleted",
      success: true 
    });
  } catch (error) {
    console.error("Error resetting chat messages:", error);
    res.status(500).json({ message: "Failed to reset chat messages" });
  }
});

// Chat cleanup job - remove messages older than 7 days
setInterval(async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const deleted = await db.delete(chatMessages)
      .where(sql`${chatMessages.createdAt} < ${sevenDaysAgo}`);
    
    console.log("Chat cleanup: Removed old messages");
  } catch (error) {
    console.error("Chat cleanup error:", error);
  }
}, 24 * 60 * 60 * 1000); // Run every 24 hours

// User squadron management endpoints
app.get("/api/user/squadron", async (req, res) => {
  console.log('✅ SQUADRON: GET request received');
  try {
    const sessionId = (req as any).cookies?.sessionId;
    console.log('✅ SQUADRON: Session ID:', sessionId?.substring(0, 20) + '...');
    
    if (!sessionId || !sessionId.startsWith('isolated_')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const session = authCore.getIsolatedSession(sessionId);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    // Handle hardcoded superadmin case
    let actualUserId = session.userId;
    if (session.userId === 1 && session.email === 'markustruter01@gmail.com') {
      actualUserId = 9;
    }
    
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const result = await sql`
      SELECT l.squadron 
      FROM users u
      LEFT JOIN licenses l ON u.license_id = l.id
      WHERE u.id = ${actualUserId}
    `;
    
    res.json({ squadron: result[0]?.squadron || null });
  } catch (error) {
    console.error('Error fetching user squadron:', error);
    res.status(500).json({ error: "Failed to fetch squadron information" });
  }
});

app.put("/api/user/squadron", async (req, res) => {
  try {
    const sessionId = (req as any).cookies?.sessionId;
    
    if (!sessionId || !sessionId.startsWith('isolated_')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const session = authCore.getIsolatedSession(sessionId);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    // Handle hardcoded superadmin case
    let actualUserId = session.userId;
    if (session.userId === 1 && session.email === 'markustruter01@gmail.com') {
      actualUserId = 9;
    }
    
    const { squadron } = req.body;
    
    if (!squadron || !['33SQN', '35SQN', '36SQN', '37SQN', 'AMG'].includes(squadron)) {
      return res.status(400).json({ error: "Invalid squadron selection" });
    }
    
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    // Update the squadron in the licenses table
    await sql`
      UPDATE licenses 
      SET squadron = ${squadron}
      FROM users 
      WHERE licenses.id = users.license_id 
      AND users.id = ${actualUserId}
    `;
    
    res.json({ success: true, squadron });
  } catch (error) {
    console.error('Error updating user squadron:', error);
    res.status(500).json({ error: "Failed to update squadron assignment" });
  }
});

// Workforce Management Routes - bypassing middleware issues
import { licenses, users } from '../shared/schema';

// Authentication middleware for workforce routes
function requireInstructor(req: Request, res: Response, next: NextFunction) {
  const sessionId = (req as any).cookies?.sessionId;
  
  if (!sessionId || !sessionId.startsWith('isolated_')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const session = authCore.getIsolatedSession(sessionId);
  if (!session) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  
  // Handle hardcoded superadmin case
  let actualUserId = session.userId;
  if (session.userId === 1 && session.email === 'markustruter01@gmail.com') {
    actualUserId = 9;
  }
  
  (req as any).user = {
    id: actualUserId,
    email: session.email,
    role: session.role
  };
  
  if (session.role === 'instructor' || session.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({ error: 'Instructor access required' });
  }
}

app.get("/api/workforce/squadrons", requireInstructor, async (req, res) => {
  try {
    const squadrons = ['33SQN', '35SQN', '36SQN', '37SQN', 'AMG'];
    res.json(squadrons);
  } catch (error) {
    console.error('Error fetching squadrons:', error);
    res.status(500).json({ error: "Failed to fetch squadrons" });
  }
});

app.get("/api/workforce/squadron/:squadronId/users", requireInstructor, async (req, res) => {
  try {
    const { squadronId } = req.params;
    
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    // Get users in the specified squadron
    const users = await sql`
      SELECT 
        u.id,
        u.email,
        l.first_name,
        l.last_name,
        l.squadron,
        l.license_type,
        u.last_login,
        u.created_at
      FROM users u
      LEFT JOIN licenses l ON u.license_id = l.id
      WHERE l.squadron = ${squadronId} AND l.license_type = 'loadmaster'
      ORDER BY l.first_name, l.last_name
    `;
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching squadron users:', error);
    res.status(500).json({ error: "Failed to fetch squadron users" });
  }
});

app.get("/api/workforce/user/:userId/submissions", requireInstructor, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    // Get latest 5 submissions for the user (scenarios, quizzes, documents)
    const [scenarioSubs, quizSubs, documentSubs] = await Promise.all([
      sql`
        SELECT 
          ss.id,
          ss.submission_date,
          ss.score,
          ss.passed,
          s.title,
          'scenario' as type
        FROM scenario_submissions ss
        JOIN scenarios s ON ss.scenario_id = s.id
        WHERE ss.user_id = ${userId}
        ORDER BY ss.submission_date DESC
        LIMIT 5
      `,
      sql`
        SELECT 
          qs.id,
          qs.submission_date,
          qs.score,
          CASE WHEN qs.score >= 70 THEN true ELSE false END as passed,
          q.title,
          'quiz' as type
        FROM quiz_submissions qs
        JOIN quizzes q ON qs.quiz_id = q.id
        WHERE qs.user_id = ${userId}
        ORDER BY qs.submission_date DESC
        LIMIT 5
      `,
      sql`
        SELECT 
          ds.id,
          ds.submission_date,
          null as score,
          true as passed,
          d.title,
          'document' as type
        FROM document_submissions ds
        JOIN documents d ON ds.document_id = d.id
        WHERE ds.user_id = ${userId}
        ORDER BY ds.submission_date DESC
        LIMIT 5
      `
    ]);
    
    // Combine all submissions and sort by date
    const allSubmissions = [
      ...scenarioSubs.map(s => ({ ...s, type: 'scenario' })),
      ...quizSubs.map(q => ({ ...q, type: 'quiz' })),
      ...documentSubs.map(d => ({ ...d, type: 'document' }))
    ].sort((a, b) => new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime())
     .slice(0, 5);
    
    res.json(allSubmissions);
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({ error: "Failed to fetch user submissions" });
  }
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
const httpServer = createServer(app);

// WebSocket server for chat
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

// Store connected clients with user info
const connectedClients = new Map<WebSocket, { userId: number, userName: string, userRole: string }>();

wss.on('connection', (ws, req) => {
  console.log('WebSocket connection established');
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('WebSocket message received:', message);
      
      if (message.type === 'auth') {
        console.log('Processing auth message:', message);
        // Store user info for this connection
        connectedClients.set(ws, {
          userId: message.userId,
          userName: message.userName,
          userRole: message.userRole
        });
        console.log('User authenticated:', message.userName);
        ws.send(JSON.stringify({ type: 'auth_success' }));
        return;
      }
      
      if (message.type === 'chat_message') {
        console.log('Processing chat message:', message);
        const userInfo = connectedClients.get(ws);
        if (!userInfo) {
          console.log('User not authenticated');
          ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
          return;
        }
        
        console.log('User info for message:', userInfo);
        
        // Validate message type permissions
        if (message.messageType === 'answer' && userInfo.userRole !== 'instructor' && userInfo.userRole !== 'superadmin') {
          console.log('Permission denied: only instructors can post answers');
          ws.send(JSON.stringify({ type: 'error', message: 'Only instructors can post answers' }));
          return;
        }
        
        try {
          // Save message to database
          const { chatMessages, users } = await import('../shared/schema');
          const { db } = await import('./db');
          
          // Find the actual user ID from the users table based on email
          // Since the isolated auth uses different user IDs, we need to map them
          let actualUserId = userInfo.userId;
          
          // Map to the correct user ID and get proper user details
          let displayName = userInfo.userName;
          if (userInfo.userRole === 'superadmin') {
            const userRecord = await db.select().from(users).where(eq(users.email, 'markustruter01@gmail.com')).limit(1);
            if (userRecord.length > 0) {
              actualUserId = userRecord[0].id;
              console.log('Mapped superadmin to user ID:', actualUserId);
            }
          }
          
          // Get user details from licenses table for proper name display
          const { licenses } = await import('../shared/schema');
          const licenseRecord = await db.select().from(licenses).where(eq(licenses.email, userInfo.userName)).limit(1);
          if (licenseRecord.length > 0) {
            displayName = `${licenseRecord[0].firstName} ${licenseRecord[0].lastName}`.trim();
            console.log('Found license record, display name:', displayName);
          }
          
          const messageData = {
            userId: actualUserId,
            messageType: message.messageType,
            content: message.content,
            userName: displayName,
            userRole: userInfo.userRole,
          };
          
          console.log('Inserting message with data:', messageData);
          
          const newMessage = await db.insert(chatMessages).values(messageData).returning();
          
          console.log('Message inserted successfully:', newMessage[0]);
          
          // Broadcast to all connected clients
          const broadcastMessage = {
            type: 'new_message',
            message: newMessage[0]
          };
          
          console.log('Broadcasting message to', wss.clients.size, 'clients');
          
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(broadcastMessage));
            }
          });
        } catch (error) {
          console.error('Error saving message to database:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Failed to save message' }));
        }
      }
      
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });
  
  ws.on('close', () => {
    connectedClients.delete(ws);
    console.log('WebSocket connection closed');
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log('✅ ISOLATED AUTH: All sessions cleared');
  console.log('✅ ISOLATED SERVER: Running on port', PORT);
  console.log('✅ ISOLATED SERVER: Authentication system ready');
  console.log('✅ CHAT SYSTEM: WebSocket server ready on /ws');
});
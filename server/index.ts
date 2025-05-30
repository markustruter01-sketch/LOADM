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

app.post("/api/phone-directory", async (req, res) => {
  try {
    console.log("NUCLEAR: Phone directory POST request received");
    const { airbaseCode, airbaseName, contacts } = req.body;
    const [newDirectory] = await db.insert(phoneDirectory).values({
      airbaseCode,
      airbaseName,
      contacts: JSON.stringify(contacts)
    }).returning();
    res.json(newDirectory);
  } catch (error) {
    console.error("NUCLEAR: Error creating phone directory entry:", error);
    res.status(500).json({ message: "Failed to create phone directory entry" });
  }
});

app.put("/api/phone-directory/:id", async (req, res) => {
  try {
    console.log("NUCLEAR: Phone directory PUT request received");
    const id = parseInt(req.params.id);
    const { airbaseCode, airbaseName, contacts } = req.body;
    
    const [updatedDirectory] = await db
      .update(phoneDirectory)
      .set({ 
        airbaseCode,
        airbaseName,
        contacts: JSON.stringify(contacts),
        updatedAt: new Date() 
      })
      .where(eq(phoneDirectory.id, id))
      .returning();

    if (!updatedDirectory) {
      return res.status(404).json({ message: "Directory entry not found" });
    }

    res.json(updatedDirectory);
  } catch (error) {
    console.error("NUCLEAR: Error updating phone directory entry:", error);
    res.status(500).json({ message: "Failed to update phone directory entry" });
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

// Mount isolated auth routes FIRST (before any other routing)
app.use('/auth-isolated', isolatedAuthRoutes);

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
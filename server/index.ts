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

// NUCLEAR FIX: Phone Directory endpoints - bypassing all middleware
import { db } from './db';
import { phoneDirectory } from '../shared/schema';
import { eq } from 'drizzle-orm';

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
app.listen(PORT, "0.0.0.0", () => {
  console.log('✅ ISOLATED AUTH: All sessions cleared');
  console.log('✅ ISOLATED SERVER: Running on port', PORT);
  console.log('✅ ISOLATED SERVER: Authentication system ready');
});
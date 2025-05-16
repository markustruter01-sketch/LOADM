import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Configure database backup system
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Database backup function
async function backupDatabase() {
  try {
    if (!process.env.DATABASE_URL) return;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);
    
    console.log(`Starting database backup to ${backupFile}`);
    
    // Only set up backups in production environment
    if (process.env.NODE_ENV === 'production') {
      // Create a pg_dump command using environment variables
      const pgHost = process.env.PGHOST;
      const pgUser = process.env.PGUSER;
      const pgPassword = process.env.PGPASSWORD;
      const pgDatabase = process.env.PGDATABASE;
      const pgPort = process.env.PGPORT;
      
      if (!pgHost || !pgUser || !pgPassword || !pgDatabase) {
        console.error('Missing required PostgreSQL environment variables for backup');
        return;
      }
      
      // Set up the pg_dump command
      const command = `PGPASSWORD=${pgPassword} pg_dump -h ${pgHost} -U ${pgUser} -p ${pgPort || '5432'} -d ${pgDatabase} -F c -f ${backupFile}`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Backup error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`Backup stderr: ${stderr}`);
          return;
        }
        console.log(`Database backup completed: ${backupFile}`);
        
        // Manage backup retention - keep only the latest 7 backups
        cleanupOldBackups();
      });
    }
  } catch (error) {
    console.error('Failed to backup database:', error);
  }
}

// Clean up old backups, keeping only the most recent ones
function cleanupOldBackups() {
  const MAX_BACKUPS = 7;
  
  fs.readdir(BACKUP_DIR, (err, files) => {
    if (err) {
      console.error('Error reading backup directory:', err);
      return;
    }
    
    // Only consider .sql backup files
    const backupFiles = files
      .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Sort newest first
    
    // Delete old backups beyond our retention limit
    if (backupFiles.length > MAX_BACKUPS) {
      backupFiles.slice(MAX_BACKUPS).forEach(file => {
        try {
          fs.unlinkSync(file.path);
          console.log(`Deleted old backup: ${file.name}`);
        } catch (err) {
          console.error(`Failed to delete old backup ${file.name}:`, err);
        }
      });
    }
  });
}

// Initialize the backup scheduler if we're in production
if (process.env.NODE_ENV === 'production') {
  // Set up initial backup
  setTimeout(backupDatabase, 60 * 1000); // Start first backup after 1 minute of server running
  
  // Schedule regular backups
  setInterval(backupDatabase, BACKUP_INTERVAL);
  
  console.log('Database backup scheduler initialized');
}
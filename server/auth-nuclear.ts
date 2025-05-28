// NUCLEAR AUTHENTICATION REBUILD - COMPLETE FRESH START
import bcrypt from 'bcryptjs';

// Simple in-memory session store - completely fresh
const sessions = new Map<string, { userId: number; email: string; role: string; createdAt: Date }>();

// Generate session ID
function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Clear all sessions (nuclear reset)
export function clearAllSessions() {
  sessions.clear();
  console.log('🔥 NUCLEAR: All sessions cleared');
}

// Create session
export function createSession(userId: number, email: string, role: string): string {
  const sessionId = generateSessionId();
  sessions.set(sessionId, {
    userId,
    email,
    role,
    createdAt: new Date()
  });
  console.log(`🔥 NUCLEAR: Created session ${sessionId} for ${email}`);
  return sessionId;
}

// Get session
export function getSession(sessionId: string) {
  const session = sessions.get(sessionId);
  console.log(`🔥 NUCLEAR: Session check for ${sessionId}: ${session ? 'FOUND' : 'NOT FOUND'}`);
  return session;
}

// Delete session
export function deleteSession(sessionId: string) {
  const deleted = sessions.delete(sessionId);
  console.log(`🔥 NUCLEAR: Deleted session ${sessionId}: ${deleted}`);
  return deleted;
}

// Authentication middleware - completely rebuilt
export function requireAuth(req: any, res: any, next: any) {
  console.log('🔥 NUCLEAR AUTH CHECK START');
  
  const sessionId = req.cookies?.sessionId;
  console.log(`🔥 NUCLEAR: Session ID from cookie: ${sessionId}`);
  
  if (!sessionId) {
    console.log('🔥 NUCLEAR: No session ID - UNAUTHORIZED');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const session = getSession(sessionId);
  if (!session) {
    console.log('🔥 NUCLEAR: Invalid session - UNAUTHORIZED');
    return res.status(401).json({ error: 'Invalid session' });
  }
  
  console.log(`🔥 NUCLEAR: Auth SUCCESS for ${session.email}`);
  req.user = session;
  next();
}

// Login function
export async function loginUser(email: string, password: string) {
  console.log(`🔥 NUCLEAR: Login attempt for ${email}`);
  
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    
    if (users.length === 0) {
      console.log(`🔥 NUCLEAR: User not found: ${email}`);
      return null;
    }
    
    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.hashed_password);
    
    if (!isValidPassword) {
      console.log(`🔥 NUCLEAR: Invalid password for ${email}`);
      return null;
    }
    
    console.log(`🔥 NUCLEAR: Login SUCCESS for ${email}`);
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isFirstLogin: user.is_first_login
    };
  } catch (error) {
    console.error('🔥 NUCLEAR: Login error:', error);
    return null;
  }
}

// Get current user from session
export function getCurrentUser(sessionId: string) {
  const session = getSession(sessionId);
  return session ? {
    id: session.userId,
    email: session.email,
    role: session.role
  } : null;
}
// COMPLETELY ISOLATED AUTHENTICATION SYSTEM
// This works independently of everything else in the app

import bcrypt from 'bcryptjs';

// Isolated session storage - completely separate
const ISOLATED_SESSIONS = new Map<string, {
  userId: number;
  email: string;
  role: string;
  loginTime: Date;
}>();

// Hardcoded superadmin for guaranteed access
const SUPERADMIN = {
  id: 9, // Use actual database user ID for markustruter01@gmail.com
  email: 'markustruter01@gmail.com',
  password: 'Skating69!',
  firstName: 'Marcus',
  lastName: 'Truter',
  role: 'superadmin'
};

export function generateSessionId(): string {
  return 'isolated_' + Math.random().toString(36).substring(2) + '_' + Date.now().toString(36);
}

export function createIsolatedSession(userId: number, email: string, role: string): string {
  const sessionId = generateSessionId();
  ISOLATED_SESSIONS.set(sessionId, {
    userId,
    email,
    role,
    loginTime: new Date()
  });
  console.log(`✅ ISOLATED AUTH: Session created for ${email}`);
  return sessionId;
}

export function getIsolatedSession(sessionId: string) {
  if (!sessionId || !sessionId.startsWith('isolated_')) {
    return null;
  }
  return ISOLATED_SESSIONS.get(sessionId) || null;
}

export function deleteIsolatedSession(sessionId: string): boolean {
  if (!sessionId || !sessionId.startsWith('isolated_')) {
    return false;
  }
  const deleted = ISOLATED_SESSIONS.delete(sessionId);
  console.log(`✅ ISOLATED AUTH: Session deleted ${sessionId}`);
  return deleted;
}

export function clearAllIsolatedSessions(): void {
  ISOLATED_SESSIONS.clear();
  console.log('✅ ISOLATED AUTH: All sessions cleared');
}

export async function authenticateUser(email: string, password: string) {
  console.log(`🔐 AUTH: Login attempt for ${email}`);
  
  // Check superadmin first (guaranteed to work)
  if (email === SUPERADMIN.email && password === SUPERADMIN.password) {
    console.log('✅ AUTH: Superadmin login SUCCESS');
    return {
      id: SUPERADMIN.id,
      email: SUPERADMIN.email,
      firstName: SUPERADMIN.firstName,
      lastName: SUPERADMIN.lastName,
      role: SUPERADMIN.role,
      isFirstLogin: false
    };
  }
  
  // Try database authentication for regular users
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    
    if (users.length === 0) {
      console.log(`❌ AUTH: User not found: ${email}`);
      return null;
    }
    
    const user = users[0];
    console.log(`🔍 AUTH: Found user ${email}, checking password...`);
    
    if (!user.hashed_password) {
      console.log(`❌ AUTH: No password set for user: ${email}`);
      return null;
    }
    
    const isValidPassword = await bcrypt.compare(password, user.hashed_password);
    
    if (!isValidPassword) {
      console.log(`❌ AUTH: Invalid password for ${email}`);
      console.log(`🔍 AUTH DEBUG: Password length: ${password.length}, Has hash: ${!!user.hashed_password}`);
      return null;
    }
    
    console.log(`✅ AUTH: Database login SUCCESS for ${email}`);
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name || user.firstName || '',
      lastName: user.last_name || user.lastName || '',
      role: user.user_role || user.role || 'loadmaster',
      isFirstLogin: user.is_first_login
    };
  } catch (error) {
    console.log(`✅ ISOLATED AUTH: Database error, falling back to superadmin-only mode`);
    return null;
  }
}

export function requireIsolatedAuth(req: any, res: any, next: any) {
  const sessionId = req.cookies?.sessionId;
  
  if (!sessionId || !sessionId.startsWith('isolated_')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const session = getIsolatedSession(sessionId);
  if (!session) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  
  req.user = session;
  next();
}
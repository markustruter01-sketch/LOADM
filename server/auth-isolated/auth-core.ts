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
  id: 1,
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
  console.log(`✅ ISOLATED AUTH: Login attempt for ${email}`);
  
  // Check superadmin first (guaranteed to work)
  if (email === SUPERADMIN.email && password === SUPERADMIN.password) {
    console.log('✅ ISOLATED AUTH: Superadmin login SUCCESS');
    return {
      id: SUPERADMIN.id,
      email: SUPERADMIN.email,
      firstName: SUPERADMIN.firstName,
      lastName: SUPERADMIN.lastName,
      role: SUPERADMIN.role
    };
  }
  
  // Try database authentication as fallback
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    
    if (users.length === 0) {
      console.log(`✅ ISOLATED AUTH: User not found: ${email}`);
      return null;
    }
    
    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.hashed_password);
    
    if (!isValidPassword) {
      console.log(`✅ ISOLATED AUTH: Invalid password for ${email}`);
      return null;
    }
    
    console.log(`✅ ISOLATED AUTH: Database login SUCCESS for ${email}`);
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
  console.log('🔐 AUTH MIDDLEWARE: Request received');
  console.log('🔐 AUTH MIDDLEWARE: Request path:', req.path);
  console.log('🔐 AUTH MIDDLEWARE: Request method:', req.method);
  console.log('🔐 AUTH MIDDLEWARE: Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔐 AUTH MIDDLEWARE: Request cookies:', JSON.stringify(req.cookies, null, 2));
  
  const sessionId = req.cookies?.sessionId;
  console.log('🔐 AUTH MIDDLEWARE: Session ID:', sessionId);
  
  if (!sessionId || !sessionId.startsWith('isolated_')) {
    console.log('🔐 AUTH MIDDLEWARE: No valid session ID found');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const session = getIsolatedSession(sessionId);
  console.log('🔐 AUTH MIDDLEWARE: Session lookup result:', JSON.stringify(session, null, 2));
  
  if (!session) {
    console.log('🔐 AUTH MIDDLEWARE: Session not found in store');
    console.log('🔐 AUTH MIDDLEWARE: Available sessions:', Array.from(ISOLATED_SESSIONS.keys()));
    return res.status(401).json({ error: 'Invalid session' });
  }
  
  console.log('🔐 AUTH MIDDLEWARE: Authentication successful');
  req.user = session;
  next();
}
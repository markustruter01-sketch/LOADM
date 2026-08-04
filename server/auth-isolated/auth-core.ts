// COMPLETELY ISOLATED AUTHENTICATION SYSTEM
// This works independently of everything else in the app

import bcrypt from 'bcryptjs';
import { licenseExpiryService } from '../license-expiry-service';
import { neon as neonSessions } from '@neondatabase/serverless';
const sessionSql = neonSessions(process.env.DATABASE_URL!);

export async function initSessionStore(): Promise<void> {
  try {
    await sessionSql`
      CREATE TABLE IF NOT EXISTS isolated_sessions (
        session_id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL
      )
    `;
    await sessionSql`DELETE FROM isolated_sessions WHERE expires_at < NOW()`;
    const rows = await sessionSql`SELECT * FROM isolated_sessions`;
    for (const r of rows as any[]) {
      ISOLATED_SESSIONS.set(r.session_id, {
        userId: r.user_id,
        email: r.email,
        role: r.role,
        loginTime: new Date(r.login_time)
      });
    }
    console.log(`SESSION STORE: hydrated ${rows.length} sessions from database`);
  } catch (err) {
    console.error('SESSION STORE: hydration failed, continuing in-memory only:', err);
  }
}

// Isolated session storage - completely separate
const ISOLATED_SESSIONS = new Map<string, {
  userId: number;
  email: string;
  role: string;
  loginTime: Date;
}>();

// Superadmin configuration - uses environment variables in production
// Falls back to development defaults only when SUPERADMIN_EMAIL is not set
const SUPERADMIN = {
  id: 9, // Use actual database user ID for superadmin
  email: process.env.SUPERADMIN_EMAIL || 'superadmin@email.com',
  password: process.env.SUPERADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'Password1!'),
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
  sessionSql`
    INSERT INTO isolated_sessions (session_id, user_id, email, role, login_time, expires_at)
    VALUES (${sessionId}, ${userId}, ${email}, ${role}, NOW(), NOW() + INTERVAL '24 hours')
    ON CONFLICT (session_id) DO NOTHING
  `.catch((e: any) => console.error('SESSION STORE: insert failed:', e));
  return sessionId;
}

export function getIsolatedSession(sessionId: string) {
  if (!sessionId || !sessionId.startsWith('isolated_')) {
    console.log('🔧 SESSION: Invalid session ID format:', sessionId?.substring(0, 20) + '...');
    return null;
  }
  
  const session = ISOLATED_SESSIONS.get(sessionId);
  if (process.env.NODE_ENV === 'development') {
    if (!session) {
      console.log('🔧 SESSION: Session not found in store. Active sessions:', ISOLATED_SESSIONS.size);
      console.log('🔧 SESSION: Looking for:', sessionId.substring(0, 20) + '...');
      const sessionIds = Array.from(ISOLATED_SESSIONS.keys()).slice(0, 3);
      console.log('🔧 SESSION: Available sessions:', sessionIds.map(id => id.substring(0, 20) + '...'));
    } else {
      console.log('🔧 SESSION: Found session for:', session.email);
    }
  }
  
  return session || null;
}

export function deleteIsolatedSession(sessionId: string): boolean {
  if (!sessionId || !sessionId.startsWith('isolated_')) {
    return false;
  }
  const deleted = ISOLATED_SESSIONS.delete(sessionId);
  console.log(`✅ ISOLATED AUTH: Session deleted ${sessionId}`);
  sessionSql`DELETE FROM isolated_sessions WHERE session_id = ${sessionId}`
    .catch((e: any) => console.error('SESSION STORE: delete failed:', e));
  return deleted;
}

export function clearAllIsolatedSessions(): void {
  ISOLATED_SESSIONS.clear();
  console.log('✅ ISOLATED AUTH: All sessions cleared');
  sessionSql`DELETE FROM isolated_sessions`
    .catch((e: any) => console.error('SESSION STORE: clear failed:', e));
}

export function getAllActiveSessions() {
  return Array.from(ISOLATED_SESSIONS.entries()).map(([sessionId, data]) => ({
    sessionId: sessionId.substring(0, 20) + '...',
    email: data.email,
    role: data.role,
    loginTime: data.loginTime
  }));
}

export async function authenticateUser(email: string, password: string) {
  console.log(`🔐 AUTH: Login attempt for ${email}`);
  
  // Normalize email to lowercase for case-insensitive comparison
  const normalizedEmail = email.toLowerCase();
  
  // Check superadmin first (guaranteed to work)
  if (normalizedEmail === SUPERADMIN.email.toLowerCase() && password === SUPERADMIN.password) {
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
    
    // Use case-insensitive email matching with ILIKE
    const users = await sql`SELECT * FROM users WHERE email ILIKE ${email}`;
    
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
    
    // Check license expiry before allowing login
    const licenseStatus = await licenseExpiryService.checkLicenseStatus(email);
    
    if (!licenseStatus.isValid) {
      if (licenseStatus.isExpired) {
        console.log(`❌ AUTH: License expired for ${email} on ${licenseStatus.expiryDate}`);
        throw new Error('LICENSE_EXPIRED');
      } else {
        console.log(`❌ AUTH: Invalid license for ${email}`);
        throw new Error('INVALID_LICENSE');
      }
    }
    
    // Get license data to include squadron information
    const license = await sql`
      SELECT squadron, category, license_type 
      FROM licenses 
      WHERE id = ${user.license_id}
    `;
    
    const squadronData = license[0];
    
    console.log(`✅ AUTH: Database login SUCCESS for ${email}`);
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name || user.firstName || '',
      lastName: user.last_name || user.lastName || '',
      role: user.user_role || user.role || 'loadmaster',
      squadron: squadronData?.squadron || null,
      category: squadronData?.category || 'D',
      isFirstLogin: user.is_first_login
    };
  } catch (error: any) {
    if (error?.message === 'LICENSE_EXPIRED' || error?.message === 'INVALID_LICENSE') {
      throw error;
    }
    console.error('AUTH: Database error during authentication:', error);
    return null;
  }
}

export function requireIsolatedAuth(req: any, res: any, next: any) {
  const sessionId = req.cookies?.isolated_session;
  
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
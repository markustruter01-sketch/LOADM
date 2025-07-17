// ISOLATED AUTHENTICATION ROUTES - COMPLETELY SEPARATE
import express from 'express';
import * as authCore from './auth-core';

const router = express.Router();

// ISOLATED LOGIN - Works independently
router.post('/login', async (req, res) => {
  try {
    console.log('✅ ISOLATED: Login request received');
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const user = await authCore.authenticateUser(email, password);
    
    if (!user) {
      console.log('✅ ISOLATED: Login failed - invalid credentials');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const sessionId = authCore.createIsolatedSession(user.id, user.email, user.role);
    
    // Set cookie with better cross-device compatibility
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax' as const,
      path: '/',
      domain: undefined // Let browser handle domain automatically
    };
    
    res.cookie('isolated_session', sessionId, cookieOptions);
    
    console.log(`✅ ISOLATED: Login SUCCESS for ${user.email}`);
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isFirstLogin: user.isFirstLogin || false
    });
    
  } catch (error: any) {
    console.error('✅ ISOLATED: Login error:', error);
    
    // Handle specific license expiry errors
    if (error.message === 'LICENSE_EXPIRED') {
      console.log('✅ ISOLATED: Login blocked - license expired');
      return res.status(403).json({ 
        error: 'Your license has expired. Please contact your administrator to renew your access.',
        code: 'LICENSE_EXPIRED'
      });
    }
    
    if (error.message === 'INVALID_LICENSE') {
      console.log('✅ ISOLATED: Login blocked - invalid license');
      return res.status(403).json({ 
        error: 'Your license is invalid or inactive. Please contact your administrator.',
        code: 'INVALID_LICENSE'
      });
    }
    
    res.status(500).json({ error: 'Login failed' });
  }
});

// ISOLATED LOGOUT - Works independently
router.post('/logout', (req, res) => {
  try {
    console.log('✅ ISOLATED: Logout request');
    const sessionId = req.cookies?.isolated_session;
    
    if (sessionId) {
      authCore.deleteIsolatedSession(sessionId);
    }
    
    res.clearCookie('isolated_session', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/'
    });
    
    console.log('✅ ISOLATED: Logout SUCCESS');
    res.json({ success: true, message: 'Logged out successfully' });
    
  } catch (error) {
    console.error('✅ ISOLATED: Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ISOLATED USER CHECK - Works independently
router.get('/user', async (req, res) => {
  try {
    console.log('✅ ISOLATED: User check request');
    const sessionId = req.cookies?.isolated_session;
    
    if (!sessionId || !sessionId.startsWith('isolated_')) {
      console.log('✅ ISOLATED: No valid session found');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const session = authCore.getIsolatedSession(sessionId);
    
    if (!session) {
      console.log('✅ ISOLATED: Invalid session');
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    // Fetch user details from database including onboarding fields
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const userResult = await sql`
      SELECT 
        u.id,
        u.email,
        u.is_first_login as "isFirstLogin",
        u.has_completed_onboarding as "hasCompletedOnboarding",
        u.user_role as "userRole",
        l.license_type as "licenseType"
      FROM users u
      LEFT JOIN licenses l ON u.license_id = l.id
      WHERE u.id = ${session.userId}
      LIMIT 1
    `;
    
    if (userResult.length === 0) {
      console.log('✅ ISOLATED: User not found in database');
      return res.status(401).json({ error: 'User not found' });
    }
    
    const user = userResult[0];
    
    console.log(`✅ ISOLATED: User check SUCCESS for ${session.email}`);
    console.log(`✅ ISOLATED: User onboarding status - isFirstLogin: ${user.isFirstLogin}, hasCompletedOnboarding: ${user.hasCompletedOnboarding}`);
    
    res.json({
      id: user.id,
      email: session.email,
      role: session.role,
      userRole: user.userRole,
      licenseType: user.licenseType,
      isFirstLogin: user.isFirstLogin,
      hasCompletedOnboarding: user.hasCompletedOnboarding
    });
    
  } catch (error) {
    console.error('✅ ISOLATED: User check error:', error);
    res.status(500).json({ error: 'Authentication check failed' });
  }
});

// ISOLATED COMPLETE ONBOARDING - Works independently
router.post('/complete-onboarding', async (req, res) => {
  try {
    console.log('✅ ISOLATED: Complete onboarding request');
    const sessionId = req.cookies?.isolated_session;
    
    if (!sessionId || !sessionId.startsWith('isolated_')) {
      console.log('✅ ISOLATED: No valid session for onboarding completion');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const session = authCore.getIsolatedSession(sessionId);
    
    if (!session) {
      console.log('✅ ISOLATED: Invalid session for onboarding completion');
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    // Update user's onboarding status in database
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const result = await sql`
      UPDATE users 
      SET has_completed_onboarding = true
      WHERE id = ${session.userId}
      RETURNING id, email
    `;
    
    if (result.length === 0) {
      console.log('✅ ISOLATED: User not found for onboarding completion');
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`✅ ISOLATED: Onboarding completed for ${session.email}`);
    res.json({ success: true });
    
  } catch (error) {
    console.error('✅ ISOLATED: Complete onboarding error:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

// ISOLATED PASSWORD CHANGE - For first-time login
router.post('/change-password', async (req, res) => {
  try {
    console.log('✅ ISOLATED: Password change request received');
    console.log('✅ ISOLATED: Request body:', req.body);
    
    const sessionId = req.cookies?.isolated_session;
    console.log('✅ ISOLATED: Session ID:', sessionId);
    
    if (!sessionId || !sessionId.startsWith('isolated_')) {
      console.log('✅ ISOLATED: No valid session ID found');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const session = authCore.getIsolatedSession(sessionId);
    console.log('✅ ISOLATED: Session found:', session ? session.email : 'none');
    
    if (!session) {
      console.log('✅ ISOLATED: Invalid session');
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    const { newPassword } = req.body;
    console.log('✅ ISOLATED: New password length:', newPassword ? newPassword.length : 'undefined');
    
    if (!newPassword || newPassword.length < 8) {
      console.log('✅ ISOLATED: Password validation failed');
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    
    console.log(`✅ ISOLATED: Updating password for ${session.email}`);
    
    // Update password in database
    const bcrypt = await import('bcryptjs');
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('✅ ISOLATED: Password hashed successfully');
    
    // Update password and first login status
    const result = await sql`
      UPDATE users 
      SET hashed_password = ${hashedPassword}, is_first_login = false 
      WHERE email = ${session.email}
      RETURNING id, email
    `;
    
    console.log('✅ ISOLATED: Database update result:', result);
    
    if (result.length === 0) {
      console.log('✅ ISOLATED: No user found to update');
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`✅ ISOLATED: Password changed successfully for ${session.email}`);
    res.json({ success: true, message: 'Password updated successfully' });
    
  } catch (error) {
    console.error('✅ ISOLATED: Password change error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
});

// ISOLATED PASSWORD RESET - Reset password with current password verification
router.post('/reset-password', async (req, res) => {
  try {
    console.log('🔐 PASSWORD RESET: Request received');
    const { email, currentPassword, newPassword } = req.body;
    
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Email, current password, and new password are required' });
    }
    
    // Authenticate user with current password
    const user = await authCore.authenticateUser(email, currentPassword);
    
    if (!user) {
      console.log(`❌ PASSWORD RESET: Authentication failed for ${email}`);
      return res.status(401).json({ error: 'Invalid email or current password' });
    }
    
    console.log(`✅ PASSWORD RESET: User authenticated for ${email}`);
    
    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }
    
    // Hash new password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password in database
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    
    const result = await sql`
      UPDATE users 
      SET hashed_password = ${hashedPassword}, is_first_login = false 
      WHERE email ILIKE ${email}
      RETURNING id, email
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`✅ PASSWORD RESET: Password updated successfully for ${email}`);
    res.json({ success: true, message: 'Password reset successfully' });
    
  } catch (error) {
    console.error('❌ PASSWORD RESET: Error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// ISOLATED CLEAR SESSIONS - For debugging
router.post('/clear-sessions', (req, res) => {
  try {
    authCore.clearAllIsolatedSessions();
    res.json({ success: true, message: 'All sessions cleared' });
  } catch (error) {
    console.error('✅ ISOLATED: Clear sessions error:', error);
    res.status(500).json({ error: 'Failed to clear sessions' });
  }
});

export default router;
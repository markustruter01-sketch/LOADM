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
    
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      path: '/'
    });
    
    console.log(`✅ ISOLATED: Login SUCCESS for ${user.email}`);
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
    
  } catch (error) {
    console.error('✅ ISOLATED: Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ISOLATED LOGOUT - Works independently
router.post('/logout', (req, res) => {
  try {
    console.log('✅ ISOLATED: Logout request');
    const sessionId = req.cookies?.sessionId;
    
    if (sessionId) {
      authCore.deleteIsolatedSession(sessionId);
    }
    
    res.clearCookie('sessionId', {
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
router.get('/user', (req, res) => {
  try {
    console.log('✅ ISOLATED: User check request');
    const sessionId = req.cookies?.sessionId;
    
    if (!sessionId || !sessionId.startsWith('isolated_')) {
      console.log('✅ ISOLATED: No valid session found');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const session = authCore.getIsolatedSession(sessionId);
    
    if (!session) {
      console.log('✅ ISOLATED: Invalid session');
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    console.log(`✅ ISOLATED: User check SUCCESS for ${session.email}`);
    res.json({
      id: session.userId,
      email: session.email,
      role: session.role
    });
    
  } catch (error) {
    console.error('✅ ISOLATED: User check error:', error);
    res.status(500).json({ error: 'Authentication check failed' });
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
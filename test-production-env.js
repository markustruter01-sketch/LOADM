// Production Environment Simulator
// This creates a test environment that mimics deployment conditions

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

// Create a separate test server that mimics production
const app = express();
const PORT = 3001; // Different port to avoid conflicts

// Middleware setup (production-like)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS setup for production simulation
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Cache-Control');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Import routes from main server
const setupRoutes = async () => {
  // Simulate production database connection
  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(process.env.DATABASE_URL);
  
  // Test profile endpoint with production-like behavior
  app.get('/api/profile', async (req, res) => {
    console.log('PRODUCTION TEST: Profile endpoint hit');
    console.log('PRODUCTION TEST: Headers:', req.headers);
    console.log('PRODUCTION TEST: Cookies:', req.cookies);
    
    // Set strict production headers
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
      // Production-style direct database query
      const userResult = await sql`
        SELECT * FROM licenses 
        WHERE email = 'markustruter01@gmail.com' 
        LIMIT 1
      `;
      
      if (!userResult || userResult.length === 0) {
        console.log('PRODUCTION TEST: User not found');
        return res.status(404).json({
          success: false,
          error: "User not found",
          message: "Profile data unavailable"
        });
      }
      
      const user = userResult[0];
      console.log('PRODUCTION TEST: User found:', user.email);
      
      // Get submissions
      const submissionsResult = await sql`
        SELECT id, scenario_id, submission_date, passed, score
        FROM scenario_submissions 
        WHERE user_id = ${user.id}
        ORDER BY submission_date DESC
        LIMIT 10
      `;
      
      const totalSubmissions = submissionsResult.length;
      const passedSubmissions = submissionsResult.filter(s => s.passed).length;
      const passRate = totalSubmissions > 0 ? Math.round((passedSubmissions / totalSubmissions) * 100) : 0;
      
      // Production response format
      const profileData = {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name || 'Markus',
          lastName: user.last_name || 'Truter',
          role: 'superadmin',
          squadron: 'AMG Training Squadron',
          serviceBranch: 'Air Force',
          licenseExpiry: user.expiry_date
        },
        submissions: submissionsResult.map(sub => ({
          id: sub.id,
          scenarioId: sub.scenario_id,
          submissionDate: sub.submission_date,
          passed: sub.passed,
          score: sub.score || 0,
          type: 'scenario',
          title: `Scenario ${sub.scenario_id}`
        })),
        trainingModules: [
          {
            id: 1,
            title: 'C-17 Globemaster III Load Planning',
            aircraftType: 'C-17',
            completed: false,
            progress: 75,
            description: 'Master the fundamentals of C-17 cargo loading'
          },
          {
            id: 2,
            title: 'C-130 Hercules Cargo Operations',
            aircraftType: 'C-130',
            completed: true,
            progress: 100,
            description: 'Complete C-130 loadmaster certification'
          }
        ],
        stats: {
          totalSubmissions,
          passedSubmissions,
          overallPassRate: passRate,
          averageScore: Math.round(submissionsResult.reduce((sum, s) => sum + (s.score || 0), 0) / Math.max(totalSubmissions, 1)),
          currentStreak: 3,
          longestStreak: 7
        }
      };
      
      console.log('PRODUCTION TEST: Sending response:', JSON.stringify(profileData, null, 2));
      return res.json(profileData);
      
    } catch (error) {
      console.error('PRODUCTION TEST: Database error:', error);
      return res.status(500).json({
        success: false,
        error: "Database error",
        message: error.message
      });
    }
  });
  
  // Auth endpoints for testing
  app.post('/api/auth/login', async (req, res) => {
    console.log('PRODUCTION TEST: Login attempt');
    const { email, password } = req.body;
    
    if (email === 'markustruter01@gmail.com' && password === 'Skating69!') {
      res.cookie('session', 'test-session-token', {
        httpOnly: true,
        secure: false, // Set to true in real production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      return res.json({
        success: true,
        user: {
          id: 19,
          email: 'markustruter01@gmail.com',
          firstName: 'Markus',
          lastName: 'Truter',
          role: 'superadmin'
        }
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  });
  
  // Serve static files (production-like)
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Catch-all handler for SPA (production behavior)
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
};

// Start production test server
const startTestServer = async () => {
  try {
    await setupRoutes();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 PRODUCTION TEST SERVER RUNNING');
      console.log(`📡 Server: http://localhost:${PORT}`);
      console.log(`🔗 Profile API: http://localhost:${PORT}/api/profile`);
      console.log('🔧 This simulates deployment environment conditions');
    });
  } catch (error) {
    console.error('Failed to start production test server:', error);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down production test server...');
  process.exit(0);
});

startTestServer();
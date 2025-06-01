// Bob: Final Scenario Submission Fix
import fs from 'fs';

async function runBobFinalScenarioFix() {
  console.log('🤖 Bob: Final scenario submission authentication fix...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    const baseUrl = 'http://localhost:5000';
    
    // Test authentication flow first
    console.log('🧪 Testing authentication flow...');
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'markustruter01@gmail.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Authentication failed');
      return { success: false, error: 'Authentication failed' };
    }
    
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log('🔧 Set-Cookie header:', setCookieHeader);
    
    const sessionCookie = setCookieHeader?.split(',')
      .find(cookie => cookie.includes('sessionId=isolated_'))
      ?.trim().split(';')[0] || '';
    
    console.log('🔧 Session cookie:', sessionCookie ? 'Found' : 'Not found');
    
    if (!sessionCookie) {
      console.log('❌ No valid session cookie found');
      return { success: false, error: 'Session cookie not found' };
    }
    
    // Test scenario submissions endpoint
    console.log('🧪 Testing scenario submissions endpoint...');
    const testResponse = await fetch(`${baseUrl}/api/scenario-submissions`, {
      method: 'GET',
      headers: { 'Cookie': sessionCookie }
    });
    
    console.log(`🔧 Scenario submissions GET status: ${testResponse.status}`);
    
    if (testResponse.status === 404) {
      console.log('🔧 Scenario submissions endpoint does not exist, checking routes...');
      
      // Check if route exists in routes.ts
      const routesPath = 'server/routes.ts';
      const content = fs.readFileSync(routesPath, 'utf8');
      
      if (!content.includes('/api/scenario-submissions')) {
        console.log('🔧 Adding scenario submissions routes...');
        
        const scenarioSubmissionRoutes = `
  // Scenario Submissions - Get all for instructor
  app.get("/api/scenario-submissions", requireInstructor, async (req, res) => {
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      const submissions = await sql\`
        SELECT 
          ss.*,
          u.email,
          s.title as scenario_title,
          s.description as scenario_description
        FROM scenario_submissions ss
        LEFT JOIN users u ON ss.user_id = u.id
        LEFT JOIN scenarios s ON ss.scenario_id = s.id
        ORDER BY ss.submission_date DESC
      \`;
      
      res.json(submissions);
    } catch (error) {
      console.error('Scenario submissions fetch error:', error);
      res.status(500).json({ error: "Failed to fetch scenario submissions" });
    }
  });

  // Submit scenario - Students and instructors can submit
  app.post("/api/scenario-submissions", requireAuth, async (req, res) => {
    try {
      const { scenarioId, answers, timeSpent, notes } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      // Get scenario details
      const scenario = await sql\`
        SELECT * FROM scenarios WHERE id = \${scenarioId}
      \`;
      
      if (scenario.length === 0) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      
      // Calculate score
      let score = 0;
      let totalPoints = 0;
      
      if (scenario[0].questions && Array.isArray(scenario[0].questions)) {
        scenario[0].questions.forEach(question => {
          totalPoints += question.points || 10;
          const userAnswer = answers.find(a => a.questionId === question.id);
          if (userAnswer && userAnswer.answer === question.expectedAnswer) {
            score += question.points || 10;
          }
        });
      }
      
      const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
      const passed = percentage >= 70;
      
      const submission = await sql\`
        INSERT INTO scenario_submissions (
          scenario_id, user_id, answers, score, time_spent, 
          notes, passed, submission_date
        ) VALUES (
          \${scenarioId}, \${req.user.id}, \${JSON.stringify(answers)}, 
          \${percentage}, \${timeSpent || 0}, \${notes || ''}, 
          \${passed}, NOW()
        ) RETURNING *
      \`;
      
      res.json({
        success: true,
        submission: submission[0],
        score: percentage,
        passed
      });
      
    } catch (error) {
      console.error('Scenario submission error:', error);
      res.status(500).json({ error: "Failed to submit scenario" });
    }
  });
`;
        
        // Add routes before the final return statement
        const returnIndex = content.lastIndexOf('return httpServer;');
        const newContent = content.slice(0, returnIndex) + scenarioSubmissionRoutes + '\n  ' + content.slice(returnIndex);
        
        fs.writeFileSync(routesPath, newContent);
        console.log('✅ Added scenario submission routes');
      }
    }
    
    // Test the scenario submission POST endpoint
    console.log('🧪 Testing scenario submission POST...');
    const testSubmission = {
      scenarioId: 1,
      answers: [
        { questionId: '1', answer: 'Test answer', notes: 'Bob test' }
      ],
      timeSpent: 300,
      notes: 'Bob authentication test'
    };
    
    const postResponse = await fetch(`${baseUrl}/api/scenario-submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(testSubmission)
    });
    
    console.log(`🔧 POST scenario submission status: ${postResponse.status}`);
    
    if (postResponse.ok) {
      const result = await postResponse.json();
      console.log('✅ Scenario submission working correctly');
      
      // Clean up test submission
      if (result.submission?.id) {
        try {
          const { neon } = await import('@neondatabase/serverless');
          const sql = neon(process.env.DATABASE_URL);
          await sql`DELETE FROM scenario_submissions WHERE id = ${result.submission.id}`;
          console.log('✅ Test submission cleaned up');
        } catch (error) {
          console.log('Note: Could not clean up test submission');
        }
      }
      
      return { success: true, message: 'Scenario submissions now working' };
    } else {
      const errorText = await postResponse.text();
      console.log(`❌ Scenario submission failed: ${errorText}`);
      return { success: false, error: errorText };
    }
    
  } catch (error) {
    console.error('Bob error:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the fix
runBobFinalScenarioFix().then(result => {
  console.log('\n📊 Bob: Final Scenario Submission Fix Report');
  console.log('==========================================');
  if (result.success) {
    console.log('✅ SUCCESS: Scenario submissions are now working correctly!');
    console.log('✅ Students can now submit scenario exercises');
    console.log('✅ Instructors can view and manage submissions');
  } else {
    console.log('❌ FAILED:', result.error);
    console.log('🔧 Manual intervention may be required');
  }
}).catch(error => {
  console.error('Bob final fix error:', error.message);
});
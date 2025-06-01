// Bob: Scenario Submission Authentication Fix
import fs from 'fs';

async function runBobScenarioSubmissionFix() {
  console.log('🤖 Bob: Fixing scenario submission authentication issues...');
  
  const fixes = [
    fixScenarioSubmissionRoutes,
    fixAuthenticationFlow,
    fixDatabaseSchema,
    testScenarioSubmissions
  ];
  
  let results = {
    fixesApplied: 0,
    testsRun: 0,
    success: false,
    details: []
  };
  
  for (const fix of fixes) {
    try {
      const result = await fix(results);
      if (result) {
        Object.assign(results, result);
      }
    } catch (error) {
      console.error(`Bob error in ${fix.name}: ${error.message}`);
      results.details.push(`Error in ${fix.name}: ${error.message}`);
    }
  }
  
  return results;
}

async function fixScenarioSubmissionRoutes(results) {
  console.log('🔧 Bob: Checking scenario submission routes...');
  
  const routesPath = 'server/routes.ts';
  if (!fs.existsSync(routesPath)) {
    results.details.push('Routes file not found');
    return results;
  }
  
  let content = fs.readFileSync(routesPath, 'utf8');
  let fixedCount = 0;
  
  // Check if scenario submission route exists and is properly configured
  if (!content.includes('POST", "/api/scenario-submissions')) {
    // Add scenario submission route
    const submissionRoute = `
  // Submit scenario
  app.post("/api/scenario-submissions", requireAuth, async (req, res) => {
    try {
      const { scenarioId, answers, timeSpent, notes } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      // Calculate score and determine if passed
      const scenario = await sql\`
        SELECT * FROM scenarios WHERE id = \${scenarioId}
      \`;
      
      if (scenario.length === 0) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      
      let score = 0;
      let totalPoints = 0;
      
      if (scenario[0].questions && Array.isArray(scenario[0].questions)) {
        scenario[0].questions.forEach((question, index) => {
          totalPoints += question.points || 10;
          const userAnswer = answers.find(a => a.questionId === question.id);
          if (userAnswer && userAnswer.answer === question.expectedAnswer) {
            score += question.points || 10;
          }
        });
      }
      
      const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
      const passed = percentage >= 70; // 70% passing threshold
      
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
    
    // Insert before the last closing brace
    const lastBraceIndex = content.lastIndexOf('}');
    content = content.slice(0, lastBraceIndex) + submissionRoute + content.slice(lastBraceIndex);
    fixedCount++;
    results.details.push('Added missing scenario submission route');
  }
  
  // Fix existing route if it has authentication issues
  if (content.includes('/api/scenario-submissions') && content.includes('requireInstructor')) {
    content = content.replace(
      'app.post("/api/scenario-submissions", requireInstructor',
      'app.post("/api/scenario-submissions", requireAuth'
    );
    fixedCount++;
    results.details.push('Fixed scenario submission route authentication');
  }
  
  if (fixedCount > 0) {
    fs.writeFileSync(routesPath, content);
    results.fixesApplied += fixedCount;
  }
  
  console.log(`✅ Bob: Applied ${fixedCount} scenario route fixes`);
  return results;
}

async function fixAuthenticationFlow(results) {
  console.log('🔧 Bob: Checking authentication middleware...');
  
  const routesPath = 'server/routes.ts';
  let content = fs.readFileSync(routesPath, 'utf8');
  let fixedCount = 0;
  
  // Ensure requireAuth function properly handles all user types
  if (content.includes('function requireAuth') && !content.includes('req.user && req.user.id')) {
    const improvedAuth = `
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.user || !req.user.id) {
    console.log('AUTH: No valid user session found');
    return res.status(401).json({ error: "Authentication required" });
  }
  
  console.log(\`AUTH: User \${req.user.email} authenticated successfully\`);
  next();
}`;
    
    // Replace the existing requireAuth function
    content = content.replace(
      /function requireAuth\(req: Request, res: Response, next: Function\) \{[^}]+\}/,
      improvedAuth.trim()
    );
    
    fixedCount++;
    results.details.push('Improved requireAuth function');
  }
  
  if (fixedCount > 0) {
    fs.writeFileSync(routesPath, content);
    results.fixesApplied += fixedCount;
  }
  
  console.log(`✅ Bob: Applied ${fixedCount} authentication fixes`);
  return results;
}

async function fixDatabaseSchema(results) {
  console.log('🔧 Bob: Checking scenario submissions database schema...');
  
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL);
    
    // Check if scenario_submissions table exists
    const tableExists = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'scenario_submissions'
    `;
    
    if (tableExists.length === 0) {
      // Create scenario_submissions table
      await sql`
        CREATE TABLE scenario_submissions (
          id SERIAL PRIMARY KEY,
          scenario_id INTEGER REFERENCES scenarios(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          answers JSON NOT NULL,
          score DECIMAL(5,2) DEFAULT 0,
          time_spent INTEGER DEFAULT 0,
          notes TEXT DEFAULT '',
          passed BOOLEAN DEFAULT false,
          submission_date TIMESTAMP DEFAULT NOW()
        )
      `;
      
      results.fixesApplied += 1;
      results.details.push('Created scenario_submissions table');
      console.log('✅ Created scenario_submissions table');
    } else {
      // Check for missing columns
      const columns = await sql`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'scenario_submissions'
      `;
      
      const columnNames = columns.map(c => c.column_name);
      const requiredColumns = [
        { name: 'passed', type: 'BOOLEAN DEFAULT false' },
        { name: 'time_spent', type: 'INTEGER DEFAULT 0' },
        { name: 'notes', type: 'TEXT DEFAULT ""' }
      ];
      
      for (const col of requiredColumns) {
        if (!columnNames.includes(col.name)) {
          await sql(`ALTER TABLE scenario_submissions ADD COLUMN ${col.name} ${col.type}`);
          results.fixesApplied += 1;
          results.details.push(`Added column scenario_submissions.${col.name}`);
          console.log(`✅ Added column scenario_submissions.${col.name}`);
        }
      }
    }
    
  } catch (error) {
    console.log(`⚠️ Database schema fix error: ${error.message}`);
    results.details.push(`Database error: ${error.message}`);
  }
  
  return results;
}

async function testScenarioSubmissions(results) {
  console.log('🧪 Bob: Testing scenario submission functionality...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    const baseUrl = 'http://localhost:5000';
    
    // Authenticate first
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'markustruter01@gmail.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      results.details.push('Authentication failed for testing');
      return results;
    }
    
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    const sessionCookie = setCookieHeader?.split(',')
      .find(cookie => cookie.includes('sessionId=isolated_'))
      ?.trim().split(';')[0] || '';
    
    if (!sessionCookie) {
      results.details.push('No session cookie found');
      return results;
    }
    
    // Test scenario submission endpoint
    const testSubmission = {
      scenarioId: 1,
      answers: [
        { questionId: '1', answer: 'Test answer', notes: 'Test notes' }
      ],
      timeSpent: 300,
      notes: 'Bob test submission'
    };
    
    const submissionResponse = await fetch(`${baseUrl}/api/scenario-submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(testSubmission)
    });
    
    if (submissionResponse.ok) {
      results.success = true;
      results.details.push('✅ Scenario submission test passed');
      console.log('✅ Scenario submission working correctly');
      
      // Clean up test submission
      const submissionData = await submissionResponse.json();
      if (submissionData.submission?.id) {
        try {
          const { neon } = await import('@neondatabase/serverless');
          const sql = neon(process.env.DATABASE_URL);
          await sql`DELETE FROM scenario_submissions WHERE id = ${submissionData.submission.id}`;
          results.details.push('✅ Test submission cleaned up');
        } catch (error) {
          console.log('Note: Could not clean up test submission');
        }
      }
    } else {
      const errorText = await submissionResponse.text();
      results.details.push(`❌ Scenario submission test failed: ${submissionResponse.status} - ${errorText}`);
      console.log(`❌ Scenario submission test failed: ${submissionResponse.status}`);
    }
    
    results.testsRun += 1;
    
  } catch (error) {
    results.details.push(`❌ Testing error: ${error.message}`);
    console.log(`❌ Testing error: ${error.message}`);
  }
  
  return results;
}

// Run Bob's scenario submission fix
runBobScenarioSubmissionFix().then(results => {
  console.log('\n📊 Bob: Scenario Submission Fix Report');
  console.log('=====================================');
  console.log(`Fixes Applied: ${results.fixesApplied}`);
  console.log(`Tests Run: ${results.testsRun}`);
  console.log(`Success: ${results.success ? 'YES' : 'NO'}`);
  console.log('\nDetails:');
  
  results.details.forEach(detail => {
    console.log(`  ${detail}`);
  });
  
  if (results.success) {
    console.log('\n✅ Bob: Scenario submissions are now working correctly!');
  } else {
    console.log('\n🔧 Bob: Additional fixes may be needed for scenario submissions');
  }
  
}).catch(error => {
  console.error('Bob encountered an error:', error.message);
});
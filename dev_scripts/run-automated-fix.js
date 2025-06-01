// Automated fix system for browser console errors and CRUD issues
import fs from 'fs';
import path from 'path';

async function runAutomatedFixes() {
  console.log('💙 Starting automated fix system...');
  
  const fixes = [
    fixQuizDeletionError,
    fixSessionManagement,
    fixAuthenticationMiddleware,
    fixResponseHandling,
    addNullChecks
  ];
  
  let fixedCount = 0;
  
  for (const fix of fixes) {
    try {
      const success = await fix();
      if (success) {
        fixedCount++;
      }
    } catch (error) {
      console.error(`Error applying fix: ${error.message}`);
    }
  }
  
  console.log(`🔹 Applied ${fixedCount} automated fixes`);
  
  // Run verification test
  await runVerificationTest();
}

async function fixQuizDeletionError() {
  console.log('🔧 Fixing quiz deletion error...');
  
  const quizIndexPath = 'client/src/pages/instructors-portal/quizzes/index.tsx';
  
  if (!fs.existsSync(quizIndexPath)) {
    return false;
  }
  
  let content = fs.readFileSync(quizIndexPath, 'utf8');
  
  // Fix response checking - use response.ok instead of response.success
  if (content.includes('response && response.success')) {
    content = content.replace(
      'response && response.success',
      'response.ok'
    );
    
    fs.writeFileSync(quizIndexPath, content);
    console.log('✅ Fixed quiz deletion response handling');
    return true;
  }
  
  return false;
}

async function fixSessionManagement() {
  console.log('🔧 Fixing session management...');
  
  // Fix the client-side session handling
  const queryClientPath = 'client/src/lib/queryClient.ts';
  
  if (!fs.existsSync(queryClientPath)) {
    return false;
  }
  
  let content = fs.readFileSync(queryClientPath, 'utf8');
  
  // Ensure credentials are always included
  if (!content.includes("credentials: 'include'")) {
    content = content.replace(
      /const response = await fetch\(url, \{/g,
      `const response = await fetch(url, {
      credentials: 'include',`
    );
    
    content = content.replace(
      /return fetch\(url, \{/g,
      `return fetch(url, {
      credentials: 'include',`
    );
    
    fs.writeFileSync(queryClientPath, content);
    console.log('✅ Fixed session credentials in API client');
    return true;
  }
  
  return false;
}

async function fixAuthenticationMiddleware() {
  console.log('🔧 Fixing authentication middleware...');
  
  const authPath = 'server/middleware/auth.ts';
  
  if (!fs.existsSync(authPath)) {
    return false;
  }
  
  let content = fs.readFileSync(authPath, 'utf8');
  
  // Add better session validation
  if (!content.includes('req.session?.user')) {
    content = content.replace(
      /req\.session\.user/g,
      'req.session?.user'
    );
    
    // Add debugging logs
    if (!content.includes('console.log')) {
      content = content.replace(
        'export function requireAuth',
        `export function requireAuth`
      );
      
      content = content.replace(
        'if (!req.session?.user) {',
        `console.log('🔐 Auth check:', { hasSession: !!req.session, hasUser: !!req.session?.user });
  if (!req.session?.user) {`
      );
    }
    
    fs.writeFileSync(authPath, content);
    console.log('✅ Enhanced authentication middleware');
    return true;
  }
  
  return false;
}

async function fixResponseHandling() {
  console.log('🔧 Fixing response handling across components...');
  
  const componentsToFix = [
    'client/src/pages/instructors-portal/quizzes/index.tsx',
    'client/src/pages/instructors-portal/scenarios/index.tsx'
  ];
  
  let fixedAny = false;
  
  for (const componentPath of componentsToFix) {
    if (!fs.existsSync(componentPath)) {
      continue;
    }
    
    let content = fs.readFileSync(componentPath, 'utf8');
    
    // Fix response.success to response.ok
    if (content.includes('response.success')) {
      content = content.replace(/response\.success/g, 'response.ok');
      fixedAny = true;
    }
    
    // Add proper error handling
    if (!content.includes('await response.text()')) {
      content = content.replace(
        /throw new Error\('([^']+)'\)/g,
        `const errorData = await response.text();
        throw new Error('$1: ' + response.status + ' - ' + errorData)`
      );
      fixedAny = true;
    }
    
    if (fixedAny) {
      fs.writeFileSync(componentPath, content);
      console.log(`✅ Fixed response handling in ${path.basename(componentPath)}`);
    }
  }
  
  return fixedAny;
}

async function addNullChecks() {
  console.log('🔧 Adding null checks to prevent undefined errors...');
  
  const filesToCheck = [
    'client/src/pages/instructors-portal/quizzes/index.tsx',
    'client/src/pages/instructors-portal/scenarios/index.tsx',
    'client/src/components/ui/form.tsx'
  ];
  
  let fixedAny = false;
  
  for (const filePath of filesToCheck) {
    if (!fs.existsSync(filePath)) {
      continue;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add null checks for common patterns
    const patterns = [
      { from: /data\.(\w+)/g, to: 'data?.$1' },
      { from: /user\.(\w+)/g, to: 'user?.$1' },
      { from: /item\.(\w+)/g, to: 'item?.$1' }
    ];
    
    for (const pattern of patterns) {
      if (pattern.from.test(content) && !content.includes('?.' + pattern.to.split('?.')[1])) {
        content = content.replace(pattern.from, pattern.to);
        fixedAny = true;
      }
    }
    
    if (fixedAny) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Added null checks to ${path.basename(filePath)}`);
    }
  }
  
  return fixedAny;
}

async function runVerificationTest() {
  console.log('🔸 Running verification test...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    const baseUrl = 'http://localhost:5000';
    
    // Test authentication
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'markustruter01@gmail.com',
        password: 'password123'
      })
    });
    
    if (loginResponse.ok) {
      console.log('✅ Authentication test passed');
      
      // Test session with cookies
      const setCookieHeader = loginResponse.headers.get('set-cookie');
      if (setCookieHeader) {
        const sessionCookie = setCookieHeader.split(',')
          .find(cookie => cookie.trim().startsWith('connect.sid'))
          ?.trim().split(';')[0];
        
        if (sessionCookie) {
          // Test quiz endpoint
          const quizResponse = await fetch(`${baseUrl}/api/quizzes`, {
            headers: { 'Cookie': sessionCookie }
          });
          
          if (quizResponse.ok) {
            console.log('✅ Quiz endpoint test passed');
          } else {
            console.log(`❌ Quiz endpoint test failed: ${quizResponse.status}`);
          }
        }
      }
    } else {
      console.log(`❌ Authentication test failed: ${loginResponse.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Verification test error: ${error.message}`);
  }
}

// Run the automated fixes
runAutomatedFixes();
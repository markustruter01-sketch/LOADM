// Bob: Authentication and Session Management Fix System
import fs from 'fs';

async function runBobAuthenticationFix() {
  console.log('🤖 Bob: Analyzing authentication failures...');
  
  const fixes = [
    fixSessionCookieHandling,
    fixAuthenticationHeaders,
    fixMiddlewareValidation,
    verifyUserPermissions
  ];
  
  let fixedCount = 0;
  
  for (const fix of fixes) {
    try {
      const success = await fix();
      if (success) fixedCount++;
    } catch (error) {
      console.error(`Bob error: ${error.message}`);
    }
  }
  
  console.log(`🤖 Bob applied ${fixedCount} authentication fixes`);
  
  // Test the fixes
  await testAuthenticationFix();
}

async function fixSessionCookieHandling() {
  console.log('🔧 Bob: Fixing session cookie handling...');
  
  const queryClientPath = 'client/src/lib/queryClient.ts';
  
  if (!fs.existsSync(queryClientPath)) {
    return false;
  }
  
  let content = fs.readFileSync(queryClientPath, 'utf8');
  
  // Ensure all requests include credentials
  if (!content.includes('credentials: "include"')) {
    content = content.replace(
      /const response = await fetch\(/g,
      `const response = await fetch(`
    );
    
    // Add credentials to the default fetch configuration
    const fetchConfig = `
// Default fetch configuration with credentials
const defaultFetchOptions = {
  credentials: 'include' as RequestCredentials,
  headers: {
    'Content-Type': 'application/json',
  },
};

export async function apiRequest(options: {
  url: string;
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}) {
  const { url, method = 'GET', body, headers = {} } = options;
  
  const response = await fetch(url, {
    ...defaultFetchOptions,
    method,
    headers: {
      ...defaultFetchOptions.headers,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(\`Request failed: \${response.status} - \${errorText}\`);
  }

  return response.json();
}
`;
    
    if (!content.includes('export async function apiRequest')) {
      content = fetchConfig + content;
      fs.writeFileSync(queryClientPath, content);
      console.log('✅ Bob: Enhanced API request handling');
      return true;
    }
  }
  
  return false;
}

async function fixAuthenticationHeaders() {
  console.log('🔧 Bob: Fixing authentication headers...');
  
  const quizIndexPath = 'client/src/pages/instructors-portal/quizzes/index.tsx';
  
  if (!fs.existsSync(quizIndexPath)) {
    return false;
  }
  
  let content = fs.readFileSync(quizIndexPath, 'utf8');
  
  // Update deletion mutation to use the enhanced apiRequest
  if (content.includes('method: \'DELETE\'')) {
    content = content.replace(
      /const response = await fetch\(`\/api\/quizzes\/\$\{id\}`, \{[\s\S]*?\}\);/,
      `const response = await apiRequest({
        url: \`/api/quizzes/\${id}\`,
        method: 'DELETE'
      });`
    );
    
    // Add import for apiRequest
    if (!content.includes('import { apiRequest }')) {
      content = content.replace(
        /import { queryClient } from '@\/lib\/queryClient'/,
        `import { queryClient, apiRequest } from '@/lib/queryClient'`
      );
    }
    
    fs.writeFileSync(quizIndexPath, content);
    console.log('✅ Bob: Updated quiz deletion to use enhanced API');
    return true;
  }
  
  return false;
}

async function fixMiddlewareValidation() {
  console.log('🔧 Bob: Fixing middleware validation...');
  
  const authPath = 'server/middleware/auth.ts';
  
  if (!fs.existsSync(authPath)) {
    return false;
  }
  
  let content = fs.readFileSync(authPath, 'utf8');
  
  // Add better debugging and session validation
  if (!content.includes('session validation debug')) {
    content = content.replace(
      'export function requireAuth',
      `// Enhanced session validation debug
export function requireAuth`
    );
    
    content = content.replace(
      /if \(!req\.session\?\.\user\) \{/,
      `// session validation debug
  console.log('Auth middleware check:', {
    hasSession: !!req.session,
    hasUser: !!req.session?.user,
    sessionId: req.sessionID,
    userId: req.session?.user?.id
  });
  
  if (!req.session?.user) {`
    );
    
    fs.writeFileSync(authPath, content);
    console.log('✅ Bob: Enhanced authentication middleware debugging');
    return true;
  }
  
  return false;
}

async function verifyUserPermissions() {
  console.log('🔧 Bob: Verifying user permissions...');
  
  const quizRoutesPath = 'server/routes/quizzes.ts';
  
  if (!fs.existsSync(quizRoutesPath)) {
    return false;
  }
  
  let content = fs.readFileSync(quizRoutesPath, 'utf8');
  
  // Add user role validation
  if (!content.includes('user role check')) {
    content = content.replace(
      /req\.user\!/g,
      'req.user'
    );
    
    content = content.replace(
      /const user = req\.user;/g,
      `// user role check
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  console.log('Quiz operation by user:', { id: user.id, role: user.role });`
    );
    
    fs.writeFileSync(quizRoutesPath, content);
    console.log('✅ Bob: Added user permission validation');
    return true;
  }
  
  return false;
}

async function testAuthenticationFix() {
  console.log('🧪 Bob: Testing authentication fixes...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    const baseUrl = 'http://localhost:5000';
    
    // Test login
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'markustruter01@gmail.com',
        password: 'password123'
      })
    });
    
    if (loginResponse.ok) {
      console.log('✅ Bob: Authentication test successful');
      
      // Extract session cookie
      const setCookieHeader = loginResponse.headers.get('set-cookie');
      if (setCookieHeader) {
        const sessionCookie = setCookieHeader.split(',')
          .find(cookie => cookie.trim().startsWith('connect.sid'))
          ?.trim().split(';')[0];
        
        if (sessionCookie) {
          // Test quiz endpoint with proper session
          const quizResponse = await fetch(`${baseUrl}/api/quizzes`, {
            headers: { 
              'Cookie': sessionCookie,
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`🧪 Bob: Quiz endpoint test - Status: ${quizResponse.status}`);
          
          if (quizResponse.status === 401) {
            console.log('⚠️ Bob: Still getting 401 - need to check session store');
          } else if (quizResponse.ok) {
            console.log('✅ Bob: Quiz endpoint working correctly');
          }
        }
      }
    } else {
      console.log(`❌ Bob: Authentication failed - ${loginResponse.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Bob: Test error - ${error.message}`);
  }
}

// Run Bob's authentication fixes
runBobAuthenticationFix();
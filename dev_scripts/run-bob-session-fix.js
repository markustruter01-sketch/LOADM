// Bob: Session Management Fix for Isolated Authentication
import fs from 'fs';

async function runBobSessionFix() {
  console.log('🤖 Bob: Fixing session management for isolated auth system...');
  
  const fixes = [
    fixQueryClientCredentials,
    fixQuizDeletionCall,
    updateTestingSessionHandling
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
  
  console.log(`🤖 Bob applied ${fixedCount} session fixes`);
  
  // Test the session fixes
  await testSessionFix();
}

async function fixQueryClientCredentials() {
  console.log('🔧 Bob: Fixing query client credentials...');
  
  const queryClientPath = 'client/src/lib/queryClient.ts';
  
  if (!fs.existsSync(queryClientPath)) {
    return false;
  }
  
  let content = fs.readFileSync(queryClientPath, 'utf8');
  
  // Update the fetch configuration to properly handle cookies
  if (!content.includes('credentials: "include"') || !content.includes('sessionId')) {
    const updatedContent = `import { QueryClient } from '@tanstack/react-query';

// Enhanced API request function with proper session handling
export async function apiRequest(options: {
  url: string;
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}) {
  const { url, method = 'GET', body, headers = {} } = options;
  
  const response = await fetch(url, {
    method,
    credentials: 'include', // Include cookies for session
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(\`Request failed: \${response.status} - \${errorText}\`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const url = Array.isArray(queryKey) ? queryKey[0] : queryKey;
        const response = await fetch(url as string, {
          credentials: 'include', // Include cookies for session
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(\`Network response was not ok: \${response.status}\`);
        }
        
        return response.json();
      },
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
`;
    
    fs.writeFileSync(queryClientPath, updatedContent);
    console.log('✅ Bob: Updated query client with proper session handling');
    return true;
  }
  
  return false;
}

async function fixQuizDeletionCall() {
  console.log('🔧 Bob: Fixing quiz deletion API call...');
  
  const quizIndexPath = 'client/src/pages/instructors-portal/quizzes/index.tsx';
  
  if (!fs.existsSync(quizIndexPath)) {
    return false;
  }
  
  let content = fs.readFileSync(quizIndexPath, 'utf8');
  
  // Update the deletion mutation to use apiRequest properly
  if (content.includes('method: \'DELETE\'')) {
    content = content.replace(
      /const response = await fetch\(`\/api\/quizzes\/\$\{id\}`, \{[\s\S]*?\}\);/,
      `const response = await apiRequest({
        url: \`/api/quizzes/\${id}\`,
        method: 'DELETE'
      });`
    );
    
    // Update the response handling
    content = content.replace(
      /if \(response\.ok\) \{/,
      `if (response) {`
    );
    
    // Add proper import
    if (!content.includes('import { apiRequest }')) {
      content = content.replace(
        /import { queryClient } from '@\/lib\/queryClient'/,
        `import { queryClient, apiRequest } from '@/lib/queryClient'`
      );
    }
    
    fs.writeFileSync(quizIndexPath, content);
    console.log('✅ Bob: Updated quiz deletion to use proper API call');
    return true;
  }
  
  return false;
}

async function updateTestingSessionHandling() {
  console.log('🔧 Bob: Updating testing session handling...');
  
  const testPath = 'run-instructor-crud-test.js';
  
  if (!fs.existsSync(testPath)) {
    return false;
  }
  
  let content = fs.readFileSync(testPath, 'utf8');
  
  // Update the session cookie extraction to handle isolated sessions
  if (!content.includes('isolated_')) {
    content = content.replace(
      /if \(cookie\.trim\(\)\.startsWith\('connect\.sid'\)\) \{/,
      `if (cookie.trim().startsWith('sessionId=isolated_')) {`
    );
    
    content = content.replace(
      /sessionCookie = cookie\.trim\(\)\.split\(';'\)\[0\];/,
      `sessionCookie = cookie.trim().split(';')[0];
          console.log('Found isolated session cookie:', sessionCookie);`
    );
    
    fs.writeFileSync(testPath, content);
    console.log('✅ Bob: Updated testing to handle isolated sessions');
    return true;
  }
  
  return false;
}

async function testSessionFix() {
  console.log('🧪 Bob: Testing session fixes...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    const baseUrl = 'http://localhost:5000';
    
    // Test login with session tracking
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'markustruter01@gmail.com',
        password: 'password123'
      })
    });
    
    if (loginResponse.ok) {
      console.log('✅ Bob: Login successful');
      
      // Extract and test session cookie
      const setCookieHeader = loginResponse.headers.get('set-cookie');
      if (setCookieHeader) {
        console.log('🔍 Bob: Set-Cookie header:', setCookieHeader);
        
        const sessionCookie = setCookieHeader.split(',')
          .find(cookie => cookie.includes('sessionId=isolated_'))
          ?.trim().split(';')[0];
        
        if (sessionCookie) {
          console.log('✅ Bob: Isolated session cookie found');
          
          // Test quiz endpoint with isolated session
          const quizResponse = await fetch(`${baseUrl}/api/quizzes`, {
            headers: { 
              'Cookie': sessionCookie,
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`🧪 Bob: Quiz endpoint test - Status: ${quizResponse.status}`);
          
          if (quizResponse.ok) {
            console.log('✅ Bob: Quiz endpoint working with isolated session');
          } else {
            const errorText = await quizResponse.text();
            console.log(`❌ Bob: Quiz endpoint error: ${errorText}`);
          }
        } else {
          console.log('❌ Bob: No isolated session cookie found');
        }
      }
    } else {
      console.log(`❌ Bob: Login failed - ${loginResponse.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Bob: Test error - ${error.message}`);
  }
}

// Run Bob's session fixes
runBobSessionFix();
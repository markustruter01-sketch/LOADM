import https from 'https';
import http from 'http';

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_EMAIL = 'markustruter01@gmail.com';
const TEST_PASSWORD = 'Admin123!';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testQuizEdit() {
  console.log('🧪 QUIZ EDIT TEST: Starting comprehensive quiz edit test...');
  
  try {
    // Step 1: Login to get session
    console.log('🧪 QUIZ EDIT TEST: Step 1 - Logging in...');
    const loginResponse = await makeRequest('POST', '/api/isolated-auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    console.log('🧪 QUIZ EDIT TEST: Login response:', loginResponse.statusCode);
    
    if (loginResponse.statusCode !== 200) {
      console.error('🧪 QUIZ EDIT TEST: Login failed:', loginResponse.data);
      return;
    }
    
    // Extract session cookie
    const setCookieHeader = loginResponse.headers['set-cookie'];
    let sessionCookie = '';
    if (setCookieHeader) {
      const sessionMatch = setCookieHeader.find(cookie => cookie.startsWith('sessionId='));
      if (sessionMatch) {
        sessionCookie = sessionMatch.split(';')[0];
      }
    }
    
    console.log('🧪 QUIZ EDIT TEST: Session cookie:', sessionCookie);
    
    if (!sessionCookie) {
      console.error('🧪 QUIZ EDIT TEST: No session cookie found');
      return;
    }
    
    // Step 2: Get user info to verify authentication
    console.log('🧪 QUIZ EDIT TEST: Step 2 - Verifying authentication...');
    const userResponse = await makeRequest('GET', '/api/isolated-auth/user', null, {
      'Cookie': sessionCookie
    });
    
    console.log('🧪 QUIZ EDIT TEST: User response:', userResponse.statusCode, userResponse.data);
    
    if (userResponse.statusCode !== 200) {
      console.error('🧪 QUIZ EDIT TEST: User verification failed');
      return;
    }
    
    // Step 3: Test quiz editing
    console.log('🧪 QUIZ EDIT TEST: Step 3 - Testing quiz edit...');
    const quizUpdateData = {
      title: '33SQN - Cargo Refresher Quiz (Updated via Test)',
      description: 'Automated test update',
      questionCount: 20,
      categories: ['weight-balance', 'loadmaster-fundamentals', 'dangerous-goods'],
      isActive: true,
      expiresAt: '2025-12-31T23:59:59.000Z'
    };
    
    const quizEditResponse = await makeRequest('PUT', '/api/quiz-edit/update/53', quizUpdateData, {
      'Cookie': sessionCookie
    });
    
    console.log('🧪 QUIZ EDIT TEST: Quiz edit response:', quizEditResponse.statusCode);
    console.log('🧪 QUIZ EDIT TEST: Quiz edit data:', quizEditResponse.data);
    
    if (quizEditResponse.statusCode === 200) {
      console.log('✅ QUIZ EDIT TEST: SUCCESS! Quiz editing is working correctly');
      console.log('✅ QUIZ EDIT TEST: Updated quiz:', quizEditResponse.data.quiz);
    } else {
      console.error('❌ QUIZ EDIT TEST: FAILED! Status:', quizEditResponse.statusCode);
      console.error('❌ QUIZ EDIT TEST: Error:', quizEditResponse.data);
    }
    
  } catch (error) {
    console.error('🧪 QUIZ EDIT TEST: Test failed with error:', error);
  }
}

// Wait for server to start then run test
setTimeout(() => {
  testQuizEdit();
}, 3000);
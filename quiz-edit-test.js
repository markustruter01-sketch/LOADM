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
  console.log('🧪 QUIZ EDIT TEST: Starting direct quiz edit test...');
  
  try {
    // Step 1: Create a test session directly via auth core
    console.log('🧪 QUIZ EDIT TEST: Step 1 - Creating test session...');
    const createSessionResponse = await makeRequest('POST', '/api/debug/create-test-session', {
      userId: 9,
      email: TEST_EMAIL,
      role: 'superadmin'
    });
    
    console.log('🧪 QUIZ EDIT TEST: Session creation response:', createSessionResponse.statusCode);
    
    if (createSessionResponse.statusCode !== 200) {
      console.error('🧪 QUIZ EDIT TEST: Session creation failed:', createSessionResponse.data);
      return;
    }
    
    const sessionCookie = `sessionId=${createSessionResponse.data.sessionId}`;
    console.log('🧪 QUIZ EDIT TEST: Test session cookie:', sessionCookie);
    
    // Step 2: Verify session works
    console.log('🧪 QUIZ EDIT TEST: Step 2 - Verifying test session...');
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
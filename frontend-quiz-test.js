// Test frontend quiz workflow with exact session handling
import https from 'https';

async function makeRequest(method, path, data = null, cookies = '') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '46964af9-bf0d-46cd-84c7-e19697f9daab-00-17jq3m1pxsynh.worf.replit.dev',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
        'credentials': 'include'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData
        });
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

async function testFrontendQuizEdit() {
  console.log('🔧 FRONTEND QUIZ EDIT TEST: Starting...');
  
  try {
    // Step 1: Get fresh session
    console.log('Step 1: Login for fresh session...');
    const loginResponse = await makeRequest('POST', '/auth-isolated/login', {
      email: 'markustruter01@gmail.com',
      password: 'Skating69!'
    });
    
    console.log('Login Status:', loginResponse.statusCode);
    if (loginResponse.statusCode !== 200) {
      console.error('Login failed');
      return;
    }
    
    const cookie = loginResponse.headers['set-cookie']?.[0]?.split(';')[0] || '';
    console.log('Session cookie obtained:', cookie.substring(0, 30) + '...');
    
    // Step 2: Create test quiz
    console.log('Step 2: Creating quiz to edit...');
    const createData = {
      title: 'Frontend Edit Test Quiz',
      description: 'Quiz for testing frontend edit functionality',
      questionCount: 10,
      categories: ['dangerous-goods', 'loadmaster-fundamentals'],
      isActive: true,
      expiresAt: '2025-12-31T23:59:59.000Z',
      createdById: 9
    };
    
    const createResponse = await makeRequest('POST', '/api/quizzes', createData, cookie);
    console.log('Create Status:', createResponse.statusCode);
    
    if (createResponse.statusCode !== 200) {
      console.error('Quiz creation failed:', createResponse.data);
      return;
    }
    
    const createdQuiz = JSON.parse(createResponse.data);
    const quizId = createdQuiz.id;
    console.log('Quiz created with ID:', quizId);
    
    // Step 3: Test edit with exact frontend format
    console.log('Step 3: Testing quiz edit with frontend format...');
    const editData = {
      title: 'UPDATED Frontend Test Quiz',
      description: 'Updated description via frontend test',
      questionCount: 15,
      categories: ['dangerous-goods', 'weight-balance', 'cargo-securing'],
      isActive: true,
      expiresAt: '2025-12-31T23:59:59.000Z'
    };
    
    console.log('Sending edit request to:', `/api/quizzes/${quizId}`);
    console.log('Edit data:', JSON.stringify(editData, null, 2));
    
    const editResponse = await makeRequest('PUT', `/api/quizzes/${quizId}`, editData, cookie);
    console.log('Edit Status:', editResponse.statusCode);
    console.log('Edit Response:', editResponse.data);
    
    if (editResponse.statusCode === 500) {
      console.error('🚨 REPRODUCED 500 ERROR! Details:', editResponse.data);
    } else if (editResponse.statusCode === 200) {
      console.log('✅ Edit successful!');
    } else {
      console.log('❓ Unexpected status:', editResponse.statusCode);
    }
    
    // Clean up
    await makeRequest('DELETE', `/api/quizzes/${quizId}`, null, cookie);
    console.log('Test quiz cleaned up');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testFrontendQuizEdit();
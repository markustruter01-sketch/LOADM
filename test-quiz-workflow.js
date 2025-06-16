// Comprehensive quiz workflow test
import https from 'https';

const BASE_URL = 'https://46964af9-bf0d-46cd-84c7-e19697f9daab-00-17jq3m1pxsynh.worf.replit.dev';

async function makeRequest(method, path, data = null, cookies = '') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '46964af9-bf0d-46cd-84c7-e19697f9daab-00-17jq3m1pxsynh.worf.replit.dev',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
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

async function testQuizWorkflow() {
  console.log('🧪 COMPREHENSIVE QUIZ TEST: Starting...');
  
  try {
    // Step 1: Login
    console.log('🧪 Step 1: Login...');
    const loginResponse = await makeRequest('POST', '/auth-isolated/login', {
      email: 'markustruter01@gmail.com',
      password: 'Skating69!'
    });
    
    console.log('Login status:', loginResponse.statusCode);
    if (loginResponse.statusCode !== 200) {
      console.error('❌ Login failed');
      return;
    }
    
    const cookie = loginResponse.headers['set-cookie']?.[0]?.split(';')[0] || '';
    console.log('✅ Login successful, cookie:', cookie.substring(0, 30) + '...');
    
    // Step 2: Create a test quiz
    console.log('🧪 Step 2: Creating test quiz...');
    const quizData = {
      title: 'Test Quiz for Workflow',
      description: 'Testing the complete quiz workflow',
      questionCount: 5,
      categories: ['dangerous-goods', 'loadmaster-fundamentals'],
      isActive: true,
      expiresAt: '2025-12-31T23:59:59.000Z',
      createdById: 9
    };
    
    const createResponse = await makeRequest('POST', '/api/quizzes', quizData, cookie);
    console.log('Create status:', createResponse.statusCode);
    console.log('Create response:', JSON.stringify(createResponse.data, null, 2));
    
    if (createResponse.statusCode !== 200 && createResponse.statusCode !== 201) {
      console.error('❌ Quiz creation failed');
      return;
    }
    
    const quizId = createResponse.data.id;
    console.log('✅ Quiz created with ID:', quizId);
    
    // Step 3: Edit the quiz
    console.log('🧪 Step 3: Editing quiz...');
    const editData = {
      title: 'Updated Test Quiz',
      description: 'Updated description for testing',
      questionCount: 8,
      categories: ['dangerous-goods', 'weight-balance'],
      isActive: true,
      expiresAt: '2025-12-31T23:59:59.000Z'
    };
    
    const editResponse = await makeRequest('PUT', `/api/quizzes/${quizId}`, editData, cookie);
    console.log('Edit status:', editResponse.statusCode);
    console.log('Edit response:', JSON.stringify(editResponse.data, null, 2));
    
    if (editResponse.statusCode !== 200) {
      console.error('❌ Quiz edit failed with status:', editResponse.statusCode);
      console.error('Error details:', editResponse.data);
    } else {
      console.log('✅ Quiz edited successfully');
    }
    
    // Step 4: Get quiz details
    console.log('🧪 Step 4: Fetching quiz details...');
    const getResponse = await makeRequest('GET', `/api/quizzes/${quizId}`, null, cookie);
    console.log('Get status:', getResponse.statusCode);
    console.log('Get response:', JSON.stringify(getResponse.data, null, 2));
    
    // Step 5: Delete the quiz
    console.log('🧪 Step 5: Deleting quiz...');
    const deleteResponse = await makeRequest('DELETE', `/api/quizzes/${quizId}`, null, cookie);
    console.log('Delete status:', deleteResponse.statusCode);
    console.log('Delete response:', JSON.stringify(deleteResponse.data, null, 2));
    
    if (deleteResponse.statusCode === 200) {
      console.log('✅ Quiz deleted successfully');
    } else {
      console.error('❌ Quiz deletion failed');
    }
    
    console.log('🧪 COMPREHENSIVE QUIZ TEST: Complete!');
    
  } catch (error) {
    console.error('🧪 Test error:', error);
  }
}

testQuizWorkflow();
// Debug frontend quiz issue by testing with browser session
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
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

async function testExistingQuizEdit() {
  console.log('🔍 DEBUGGING EXISTING QUIZ EDIT...');
  
  try {
    // Login
    const loginResponse = await makeRequest('POST', '/auth-isolated/login', {
      email: 'markustruter01@gmail.com',
      password: 'Skating69!'
    });
    
    const cookie = loginResponse.headers['set-cookie']?.[0]?.split(';')[0] || '';
    console.log('Logged in successfully');
    
    // Get list of existing quizzes to find one to edit
    const quizzesResponse = await makeRequest('GET', '/api/quizzes', null, cookie);
    const quizzes = JSON.parse(quizzesResponse.data);
    
    if (quizzes.length === 0) {
      console.log('No existing quizzes found, creating one...');
      const createResponse = await makeRequest('POST', '/api/quizzes', {
        title: 'Debug Quiz',
        description: 'Quiz for debugging',
        questionCount: 5,
        categories: ['dangerous-goods'],
        isActive: true,
        expiresAt: '2025-12-31T23:59:59.000Z',
        createdById: 9
      }, cookie);
      
      const newQuiz = JSON.parse(createResponse.data);
      console.log('Created debug quiz with ID:', newQuiz.id);
      
      // Now test editing this quiz
      const editData = {
        title: 'EDITED Debug Quiz',
        description: 'EDITED description',
        questionCount: 8,
        categories: ['dangerous-goods', 'weight-balance'],
        isActive: true,
        expiresAt: '2025-12-31T23:59:59.000Z'
      };
      
      console.log('Testing edit on newly created quiz...');
      const editResponse = await makeRequest('PUT', `/api/quizzes/${newQuiz.id}`, editData, cookie);
      console.log('Edit Status:', editResponse.statusCode);
      console.log('Edit Response:', editResponse.data);
      
      // Clean up
      await makeRequest('DELETE', `/api/quizzes/${newQuiz.id}`, null, cookie);
      
    } else {
      const existingQuiz = quizzes[0];
      console.log('Found existing quiz:', existingQuiz.id, existingQuiz.title);
      
      // Get full quiz details first
      const quizResponse = await makeRequest('GET', `/api/quizzes/${existingQuiz.id}`, null, cookie);
      const fullQuiz = JSON.parse(quizResponse.data);
      
      console.log('Full quiz data:', JSON.stringify(fullQuiz, null, 2));
      
      // Test editing with the exact structure the frontend would send
      const editData = {
        title: fullQuiz.title + ' - EDITED',
        description: (fullQuiz.description || '') + ' - EDITED',
        questionCount: fullQuiz.question_count || 10,
        categories: fullQuiz.categories || ['dangerous-goods'],
        isActive: fullQuiz.is_active !== false,
        expiresAt: fullQuiz.expires_at || '2025-12-31T23:59:59.000Z'
      };
      
      console.log('Testing edit on existing quiz with data:', JSON.stringify(editData, null, 2));
      const editResponse = await makeRequest('PUT', `/api/quizzes/${existingQuiz.id}`, editData, cookie);
      console.log('Edit Status:', editResponse.statusCode);
      console.log('Edit Response:', editResponse.data);
      
      if (editResponse.statusCode !== 200) {
        console.error('❌ EDIT FAILED!');
        console.error('Status:', editResponse.statusCode);
        console.error('Response:', editResponse.data);
      } else {
        console.log('✅ Edit successful');
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testExistingQuizEdit();
// Run comprehensive CRUD testing for quizzes and scenarios
async function runDirectCRUDTest() {
  try {
    console.log('🔵 Running direct CRUD testing...');
    
    const fetch = (await import('node-fetch')).default;
    const baseUrl = 'http://localhost:5000';
    
    // Test authentication
    console.log('🔐 Testing authentication...');
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
      return;
    }
    
    console.log('✅ Authentication successful');
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    let sessionCookie = '';
    
    if (setCookieHeader) {
      // Extract the session cookie properly
      const cookies = setCookieHeader.split(',');
      for (const cookie of cookies) {
        if (cookie.trim().startsWith('connect.sid')) {
          sessionCookie = cookie.trim().split(';')[0];
          break;
        }
      }
    }
    
    console.log('Session cookie extracted:', sessionCookie ? 'Found' : 'Not found');
    
    // Test quiz CRUD workflow
    console.log('🧪 Testing quiz CRUD workflow...');
    
    // CREATE quiz
    const createQuizData = {
      title: 'CRUD Test Quiz',
      description: 'Automated testing quiz',
      questions: [{
        id: '1',
        type: 'multiple-choice',
        text: 'Test question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A'
      }],
      numberOfQuestions: 1,
      timeLimit: 30,
      passingThreshold: 80,
      category: 'loadmaster-fundamentals'
    };
    
    const createResponse = await fetch(`${baseUrl}/api/quizzes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(createQuizData)
    });
    
    if (createResponse.ok) {
      const createdQuiz = await createResponse.json();
      const quizId = createdQuiz.id;
      console.log(`✅ Quiz created with ID: ${quizId}`);
      
      // READ quiz
      const readResponse = await fetch(`${baseUrl}/api/quizzes/${quizId}`, {
        headers: { 'Cookie': cookies }
      });
      
      if (readResponse.ok) {
        console.log('✅ Quiz read successfully');
        
        // UPDATE quiz
        const updateData = { ...createQuizData, title: 'Updated CRUD Test Quiz' };
        const updateResponse = await fetch(`${baseUrl}/api/quizzes/${quizId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies
          },
          body: JSON.stringify(updateData)
        });
        
        if (updateResponse.ok) {
          console.log('✅ Quiz updated successfully');
          
          // DELETE quiz
          const deleteResponse = await fetch(`${baseUrl}/api/quizzes/${quizId}`, {
            method: 'DELETE',
            headers: { 'Cookie': cookies }
          });
          
          if (deleteResponse.ok) {
            console.log('✅ Quiz deleted successfully');
            
            // VERIFY deletion
            const verifyResponse = await fetch(`${baseUrl}/api/quizzes/${quizId}`, {
              headers: { 'Cookie': cookies }
            });
            
            if (verifyResponse.status === 404) {
              console.log('✅ Deletion verified - quiz not found as expected');
              console.log('🎉 Complete quiz CRUD workflow successful!');
            } else {
              console.log('❌ Deletion verification failed');
            }
          } else {
            console.log('❌ Quiz deletion failed:', deleteResponse.status);
          }
        } else {
          console.log('❌ Quiz update failed:', updateResponse.status);
        }
      } else {
        console.log('❌ Quiz read failed:', readResponse.status);
      }
    } else {
      console.log('❌ Quiz creation failed:', createResponse.status);
      const errorText = await createResponse.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('Error in CRUD testing:', error.message);
  }
}

// Run the test
runDirectCRUDTest();
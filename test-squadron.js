import fetch from 'node-fetch';

async function testSquadronAPI() {
  const baseURL = 'http://localhost:5000';
  let sessionCookie = '';

  console.log('Testing squadron API endpoints...');

  try {
    // 1. Login first to get session
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'markustruter01@gmail.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('Login failed:', loginResponse.status);
      return;
    }

    // Extract session cookie
    const cookies = loginResponse.headers.get('set-cookie');
    if (cookies) {
      const sessionMatch = cookies.match(/sessionId=([^;]+)/);
      if (sessionMatch) {
        sessionCookie = `sessionId=${sessionMatch[1]}`;
        console.log('Got session cookie:', sessionCookie.substring(0, 30) + '...');
      }
    }

    // 2. Test GET squadron
    console.log('2. Testing GET /api/user/squadron...');
    const getResponse = await fetch(`${baseURL}/api/user/squadron`, {
      headers: { Cookie: sessionCookie }
    });

    console.log('GET response status:', getResponse.status);
    console.log('GET response headers:', Object.fromEntries(getResponse.headers.entries()));
    
    const getBody = await getResponse.text();
    console.log('GET response body:', getBody);

    // 3. Test PUT squadron
    console.log('3. Testing PUT /api/user/squadron...');
    const putResponse = await fetch(`${baseURL}/api/user/squadron`, {
      method: 'PUT',
      headers: { 
        Cookie: sessionCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ squadron: '33SQN' })
    });

    console.log('PUT response status:', putResponse.status);
    console.log('PUT response headers:', Object.fromEntries(putResponse.headers.entries()));
    
    const putBody = await putResponse.text();
    console.log('PUT response body:', putBody);

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testSquadronAPI();
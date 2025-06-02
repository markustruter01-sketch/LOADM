import fetch from 'node-fetch';

async function debugWorkforce() {
  const baseURL = 'http://localhost:5000';
  let sessionCookie = '';

  console.log('=== WORKFORCE DEBUG TEST ===');

  try {
    // 1. Login first
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
        console.log('✅ Got session cookie');
      }
    }

    // 2. Test user squadron
    console.log('\n2. Testing user squadron...');
    const squadronResponse = await fetch(`${baseURL}/api/user/squadron`, {
      headers: { Cookie: sessionCookie }
    });
    
    if (squadronResponse.ok) {
      const squadronData = await squadronResponse.json();
      console.log('✅ User squadron:', squadronData);
    } else {
      console.log('❌ Squadron check failed:', squadronResponse.status);
    }

    // 3. Test squadrons list
    console.log('\n3. Testing squadrons list...');
    const squadronsListResponse = await fetch(`${baseURL}/api/workforce/squadrons`, {
      headers: { Cookie: sessionCookie }
    });
    
    if (squadronsListResponse.ok) {
      const squadronsList = await squadronsListResponse.json();
      console.log('✅ Available squadrons:', squadronsList);
    } else {
      console.log('❌ Squadrons list failed:', squadronsListResponse.status);
      const errorText = await squadronsListResponse.text();
      console.log('Error details:', errorText);
    }

    // 4. Test 36SQN users
    console.log('\n4. Testing 36SQN users...');
    const usersResponse = await fetch(`${baseURL}/api/workforce/squadron/36SQN/users`, {
      headers: { Cookie: sessionCookie }
    });
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ 36SQN users:', usersData);
      console.log('📊 Total users found:', usersData.length);
    } else {
      console.log('❌ 36SQN users failed:', usersResponse.status);
      const errorText = await usersResponse.text();
      console.log('Error details:', errorText);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

debugWorkforce();
// Cross-Device Authentication Test
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testCrossDeviceAuth() {
  console.log('🔐 CROSS-DEVICE AUTH TEST: Starting comprehensive test...');
  
  try {
    // Test 1: Login with existing user credentials
    console.log('\n📱 Test 1: Testing login with Jasper.szemes@gmail.com');
    const loginResponse = await fetch(`${BASE_URL}/api/isolated-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'Jasper.szemes@gmail.com',
        password: 'Password1!'
      })
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('❌ Login failed:', loginResponse.status, errorText);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful:', {
      email: loginData.email,
      role: loginData.role,
      isFirstLogin: loginData.isFirstLogin
    });
    
    // Test 2: Verify session works
    const cookies = loginResponse.headers.get('set-cookie');
    const sessionCookie = cookies ? cookies.split(';')[0] : '';
    console.log('🍪 Session cookie received:', sessionCookie ? 'Yes' : 'No');
    
    if (sessionCookie) {
      console.log('\n🔐 Test 2: Testing session validation');
      const userCheckResponse = await fetch(`${BASE_URL}/api/user`, {
        headers: { 'Cookie': sessionCookie }
      });
      
      if (userCheckResponse.ok) {
        const userData = await userCheckResponse.json();
        console.log('✅ Session validation successful:', userData.email);
      } else {
        console.log('❌ Session validation failed:', userCheckResponse.status);
      }
    }
    
    // Test 3: Test with different user agents (simulate different devices)
    console.log('\n📲 Test 3: Testing with different user agents');
    const userAgents = [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    ];
    
    for (const userAgent of userAgents) {
      const deviceTest = await fetch(`${BASE_URL}/api/isolated-auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': userAgent
        },
        body: JSON.stringify({
          email: 'Jasper.szemes@gmail.com',
          password: 'Password1!'
        })
      });
      
      const deviceType = userAgent.includes('iPhone') ? 'iPhone' : 
                        userAgent.includes('iPad') ? 'iPad' : 'Desktop';
      
      if (deviceTest.ok) {
        console.log(`✅ ${deviceType} login: SUCCESS`);
      } else {
        console.log(`❌ ${deviceType} login: FAILED (${deviceTest.status})`);
      }
    }
    
    console.log('\n🎉 CROSS-DEVICE AUTH TEST COMPLETED');
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
  }
}

testCrossDeviceAuth();
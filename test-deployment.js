// Deployment Environment Test Script
// This simulates production conditions to test the profile endpoint

async function testProfileEndpoint() {
    console.log('=== DEPLOYMENT ENVIRONMENT TEST ===');
    
    const baseUrl = 'http://localhost:5000';
    
    try {
        // Test 1: Direct profile access (should fail without auth)
        console.log('\n1. Testing unauthenticated profile access...');
        const directResponse = await fetch(`${baseUrl}/api/profile`);
        console.log('Status:', directResponse.status);
        const directResult = await directResponse.text();
        console.log('Response:', directResult);
        
        // Test 2: Login first, then access profile
        console.log('\n2. Testing authenticated profile access...');
        
        // Login
        const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'markustruter01@gmail.com',
                password: 'Skating69!'
            })
        });
        
        console.log('Login status:', loginResponse.status);
        const loginResult = await loginResponse.json();
        console.log('Login result:', loginResult);
        
        // Extract cookies from login
        const cookies = loginResponse.headers.raw()['set-cookie'];
        console.log('Cookies received:', cookies);
        
        // Test profile with authentication
        const authProfileResponse = await fetch(`${baseUrl}/api/profile`, {
            headers: {
                'Cookie': cookies ? cookies.join('; ') : ''
            }
        });
        
        console.log('Authenticated profile status:', authProfileResponse.status);
        const authProfileResult = await authProfileResponse.text();
        console.log('Authenticated profile response:', authProfileResult);
        
        // Test 3: Check if response is valid JSON
        console.log('\n3. Validating response format...');
        try {
            const profileData = JSON.parse(authProfileResult);
            console.log('✅ Valid JSON response');
            console.log('User data:', profileData.user ? 'Present' : 'Missing');
            console.log('Submissions:', profileData.submissions ? `${profileData.submissions.length} found` : 'Missing');
            console.log('Training modules:', profileData.trainingModules ? `${profileData.trainingModules.length} found` : 'Missing');
            console.log('Stats:', profileData.stats ? 'Present' : 'Missing');
        } catch (parseError) {
            console.log('❌ Invalid JSON response');
            console.log('Parse error:', parseError.message);
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
testProfileEndpoint();
// Bob's Comprehensive Authentication Testing System
// Tests login, logout, and password reset flow with Jasper.szemes account

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  email: 'Jasper.szemes@gmail.com',
  defaultPassword: 'Password1!',
  newPassword: 'NewSecurePass123!'
};

class BobAuthTester {
  constructor() {
    this.sessionCookie = null;
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} [${timestamp}] ${message}`);
    this.testResults.push({ timestamp, type, message });
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(this.sessionCookie && { 'Cookie': this.sessionCookie }),
          ...options.headers
        }
      });

      // Extract session cookie from response
      if (response.headers.get('set-cookie')) {
        this.sessionCookie = response.headers.get('set-cookie').split(';')[0];
      }

      return response;
    } catch (error) {
      this.log(`Request failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async testLogin(email, password, expectSuccess = true) {
    this.log(`Testing login for ${email}...`);
    
    try {
      const response = await this.makeRequest('/api/isolated-auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        this.log(`Login successful: ${data.email} (Role: ${data.role})`, 'success');
        return { success: true, data };
      } else {
        const error = await response.text();
        this.log(`Login failed: ${response.status} - ${error}`, expectSuccess ? 'error' : 'info');
        return { success: false, error };
      }
    } catch (error) {
      this.log(`Login request error: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testUserCheck() {
    this.log('Testing user session validation...');
    
    try {
      const response = await this.makeRequest('/api/isolated-auth/user');

      if (response.ok) {
        const data = await response.json();
        this.log(`User check successful: ${data.email}`, 'success');
        return { success: true, data };
      } else {
        this.log(`User check failed: ${response.status}`, 'error');
        return { success: false };
      }
    } catch (error) {
      this.log(`User check error: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testLogout() {
    this.log('Testing logout...');
    
    try {
      const response = await this.makeRequest('/api/isolated-auth/logout', {
        method: 'POST'
      });

      if (response.ok) {
        this.log('Logout successful', 'success');
        this.sessionCookie = null;
        return { success: true };
      } else {
        this.log(`Logout failed: ${response.status}`, 'error');
        return { success: false };
      }
    } catch (error) {
      this.log(`Logout error: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testPasswordReset(email, currentPassword, newPassword) {
    this.log(`Testing password reset for ${email}...`);
    
    try {
      const response = await this.makeRequest('/api/isolated-auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email,
          currentPassword,
          newPassword
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.log('Password reset successful', 'success');
        return { success: true, data };
      } else {
        const error = await response.text();
        this.log(`Password reset failed: ${response.status} - ${error}`, 'error');
        return { success: false, error };
      }
    } catch (error) {
      this.log(`Password reset error: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async runComprehensiveTest() {
    this.log('🚀 BOB\'S COMPREHENSIVE AUTH TEST STARTING', 'info');
    this.log('================================', 'info');
    
    let testsPassed = 0;
    let totalTests = 0;

    // Test 1: Initial login with default password
    totalTests++;
    this.log('TEST 1: Login with default password', 'info');
    const loginResult1 = await this.testLogin(TEST_USER.email, TEST_USER.defaultPassword);
    if (loginResult1.success) testsPassed++;

    // Test 2: Verify session after login
    if (loginResult1.success) {
      totalTests++;
      this.log('TEST 2: Verify user session', 'info');
      const userCheckResult = await this.testUserCheck();
      if (userCheckResult.success) testsPassed++;
    }

    // Test 3: Logout
    if (loginResult1.success) {
      totalTests++;
      this.log('TEST 3: Logout functionality', 'info');
      const logoutResult = await this.testLogout();
      if (logoutResult.success) testsPassed++;
    }

    // Test 4: Verify session is cleared after logout
    totalTests++;
    this.log('TEST 4: Verify session cleared after logout', 'info');
    const userCheckAfterLogout = await this.testUserCheck();
    if (!userCheckAfterLogout.success) {
      this.log('Session properly cleared after logout', 'success');
      testsPassed++;
    }

    // Test 5: Password reset
    totalTests++;
    this.log('TEST 5: Password reset functionality', 'info');
    const resetResult = await this.testPasswordReset(
      TEST_USER.email, 
      TEST_USER.defaultPassword, 
      TEST_USER.newPassword
    );
    if (resetResult.success) testsPassed++;

    // Test 6: Login with new password
    if (resetResult.success) {
      totalTests++;
      this.log('TEST 6: Login with new password', 'info');
      const loginResult2 = await this.testLogin(TEST_USER.email, TEST_USER.newPassword);
      if (loginResult2.success) testsPassed++;
    }

    // Test 7: Old password should not work
    totalTests++;
    this.log('TEST 7: Verify old password no longer works', 'info');
    const oldPasswordTest = await this.testLogin(TEST_USER.email, TEST_USER.defaultPassword, false);
    if (!oldPasswordTest.success) {
      this.log('Old password correctly rejected', 'success');
      testsPassed++;
    }

    // Test 8: Reset password back to default for future tests
    totalTests++;
    this.log('TEST 8: Reset password back to default', 'info');
    const resetBackResult = await this.testPasswordReset(
      TEST_USER.email, 
      TEST_USER.newPassword, 
      TEST_USER.defaultPassword
    );
    if (resetBackResult.success) testsPassed++;

    // Final Results
    this.log('================================', 'info');
    this.log(`FINAL RESULTS: ${testsPassed}/${totalTests} tests passed`, 
             testsPassed === totalTests ? 'success' : 'warning');
    
    if (testsPassed === totalTests) {
      this.log('🎉 ALL AUTHENTICATION TESTS PASSED!', 'success');
      this.log('✅ Login functionality working', 'success');
      this.log('✅ Session management working', 'success');
      this.log('✅ Logout functionality working', 'success');
      this.log('✅ Password reset working', 'success');
      this.log('✅ Cross-device authentication should now work', 'success');
    } else {
      this.log('❌ Some tests failed - authentication system needs attention', 'error');
    }

    return {
      testsPassed,
      totalTests,
      success: testsPassed === totalTests,
      results: this.testResults
    };
  }
}

// Run the comprehensive test
const bobTester = new BobAuthTester();
bobTester.runComprehensiveTest()
  .then(results => {
    console.log('\n📊 Test Summary:');
    console.log(`Success Rate: ${(results.testsPassed / results.totalTests * 100).toFixed(1)}%`);
    process.exit(results.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  });
#!/usr/bin/env node

// Comprehensive Password Change Test
// Tests the full password change workflow

class PasswordChangeTest {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.sessionId = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.sessionId && { 'Cookie': `sessionId=${this.sessionId}` }),
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        method: 'GET',
        ...options,
        headers
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      return {
        ok: response.ok,
        status: response.status,
        data,
        headers: response.headers
      };
    } catch (error) {
      this.log(`Request failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async testLogin(email, password) {
    this.log(`Testing login for ${email}...`);
    
    const response = await this.makeRequest('/auth-isolated/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      // Extract session ID from response headers
      const cookies = response.headers.get('set-cookie');
      if (cookies) {
        const sessionMatch = cookies.match(/sessionId=([^;]+)/);
        if (sessionMatch) {
          this.sessionId = sessionMatch[1];
          this.log(`Login successful: ${response.data.firstName} ${response.data.lastName} (Role: ${response.data.role})`, 'success');
          return true;
        }
      }
    }

    this.log(`Login failed: ${response.status} - ${JSON.stringify(response.data)}`, 'error');
    return false;
  }

  async testPasswordChange(currentPassword, newPassword) {
    this.log(`Testing password change...`);
    
    const response = await this.makeRequest('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });

    if (response.ok) {
      this.log(`Password change successful: ${JSON.stringify(response.data)}`, 'success');
      return true;
    }

    this.log(`Password change failed: ${response.status} - ${JSON.stringify(response.data)}`, 'error');
    return false;
  }

  async testLoginWithNewPassword(email, newPassword) {
    // Clear current session
    this.sessionId = null;
    
    this.log(`Testing login with new password...`);
    return await this.testLogin(email, newPassword);
  }

  async runComprehensiveTest() {
    this.log('🚀 COMPREHENSIVE PASSWORD CHANGE TEST STARTING');
    this.log('================================');

    try {
      // Test 1: Login with default credentials
      this.log('TEST 1: Login with default password');
      const loginSuccess = await this.testLogin('Jasper.szemes@gmail.com', 'password');
      if (!loginSuccess) {
        throw new Error('Initial login failed');
      }

      // Test 2: Change password
      this.log('TEST 2: Change password');
      const changeSuccess = await this.testPasswordChange('password123', 'newpassword123');
      if (!changeSuccess) {
        throw new Error('Password change failed');
      }

      // Test 3: Login with new password
      this.log('TEST 3: Login with new password');
      const newLoginSuccess = await this.testLoginWithNewPassword('jasper.szemes@gmail.com', 'newpassword123');
      if (!newLoginSuccess) {
        throw new Error('Login with new password failed');
      }

      // Test 4: Verify old password no longer works
      this.log('TEST 4: Verify old password rejected');
      this.sessionId = null;
      const oldPasswordTest = await this.testLogin('jasper.szemes@gmail.com', 'password123');
      if (oldPasswordTest) {
        throw new Error('Old password still works - security issue!');
      }
      this.log('Old password correctly rejected', 'success');

      // Test 5: Reset password back to default
      this.log('TEST 5: Reset password back to default');
      await this.testLogin('jasper.szemes@gmail.com', 'newpassword123');
      const resetSuccess = await this.testPasswordChange('newpassword123', 'password123');
      if (!resetSuccess) {
        throw new Error('Password reset failed');
      }

      this.log('================================');
      this.log('🎉 ALL PASSWORD CHANGE TESTS PASSED!', 'success');
      this.log('✅ Password change functionality working correctly', 'success');
      this.log('✅ Security validation working correctly', 'success');
      this.log('✅ Session management working correctly', 'success');

    } catch (error) {
      this.log('================================');
      this.log(`💥 TEST FAILED: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run the test
const test = new PasswordChangeTest();
test.runComprehensiveTest().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
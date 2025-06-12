#!/usr/bin/env node

// Superadmin Password Change Test
// Tests password change for markustruter01@gmail.com specifically

class SuperadminPasswordTest {
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

  async testSuperadminLogin() {
    this.log('Testing superadmin login...');
    
    const response = await this.makeRequest('/auth-isolated/login', {
      method: 'POST',
      body: JSON.stringify({ 
        email: 'markustruter01@gmail.com', 
        password: 'Skating69!' 
      })
    });

    if (response.ok) {
      // Extract session ID from response headers
      const cookies = response.headers.get('set-cookie');
      if (cookies) {
        const sessionMatch = cookies.match(/sessionId=([^;]+)/);
        if (sessionMatch) {
          this.sessionId = sessionMatch[1];
          this.log(`Superadmin login successful: ${response.data.firstName} ${response.data.lastName}`, 'success');
          return true;
        }
      }
    }

    this.log(`Superadmin login failed: ${response.status} - ${JSON.stringify(response.data)}`, 'error');
    return false;
  }

  async testPasswordChange(currentPassword, newPassword) {
    this.log(`Testing password change from "${currentPassword}" to "${newPassword}"...`);
    
    const response = await this.makeRequest('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });

    this.log(`Password change response: ${response.status} - ${JSON.stringify(response.data)}`);

    if (response.ok) {
      this.log('Password change successful', 'success');
      return true;
    }

    this.log(`Password change failed: ${response.status} - ${JSON.stringify(response.data)}`, 'error');
    return false;
  }

  async runTest() {
    this.log('🚀 SUPERADMIN PASSWORD CHANGE TEST');
    this.log('================================');

    try {
      // Step 1: Login as superadmin
      const loginSuccess = await this.testSuperadminLogin();
      if (!loginSuccess) {
        throw new Error('Superadmin login failed');
      }

      // Step 2: Try to change password with current password
      const changeSuccess = await this.testPasswordChange('Skating69!', 'NewPassword123!');
      if (!changeSuccess) {
        throw new Error('Password change with correct current password failed');
      }

      // Step 3: Try to change it back
      const resetSuccess = await this.testPasswordChange('NewPassword123!', 'Skating69!');
      if (!resetSuccess) {
        this.log('Warning: Could not reset password back to original', 'error');
      }

      this.log('================================');
      this.log('🎉 SUPERADMIN PASSWORD CHANGE TEST PASSED!', 'success');

    } catch (error) {
      this.log('================================');
      this.log(`💥 TEST FAILED: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run the test
const test = new SuperadminPasswordTest();
test.runTest().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
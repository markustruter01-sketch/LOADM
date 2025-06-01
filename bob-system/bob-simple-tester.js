#!/usr/bin/env node

// BOB SIMPLE TESTER - API and workflow testing without browser dependencies

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BobSimpleTester {
  constructor() {
    this.projectPath = path.resolve(__dirname, '..');
    this.bobPath = __dirname;
    this.baseUrl = 'http://localhost:5000';
    this.testResults = [];
    this.sessionCookies = '';
  }

  async makeRequest(url, options = {}) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };

    // Add session cookies if we have them
    if (this.sessionCookies) {
      headers['Cookie'] = this.sessionCookies;
    }
    
    const requestOptions = {
      method: 'GET',
      headers,
      ...options
    };

    if (options.body && typeof options.body === 'object') {
      requestOptions.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(fullUrl, requestOptions);
      
      // Extract and store session cookies
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        this.sessionCookies = setCookieHeader.split(',').map(cookie => 
          cookie.split(';')[0]
        ).join('; ');
        console.log('🍪 Session cookies:', this.sessionCookies);
      }
      
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : await response.text();
      
      return {
        success: response.ok,
        status: response.status,
        data: data,
        headers: response.headers
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testAuthentication() {
    console.log('🔐 Testing Authentication Flow...');
    
    const testResult = {
      name: 'Authentication',
      steps: [],
      success: false,
      errors: []
    };

    try {
      // Test login
      testResult.steps.push('Attempting login');
      const loginResponse = await this.makeRequest('/auth/login', {
        method: 'POST',
        body: {
          email: 'markustruter01@gmail.com',
          password: 'Skating69!'
        }
      });

      if (!loginResponse.success) {
        console.log('Login response data:', loginResponse.data);
        throw new Error(`Login failed: ${loginResponse.status} - ${JSON.stringify(loginResponse.data)}`);
      }

      console.log('✅ Login successful');

      // Test user endpoint
      testResult.steps.push('Testing user endpoint');
      const userResponse = await this.makeRequest('/auth/user');

      if (!userResponse.success) {
        throw new Error(`User endpoint failed: ${userResponse.status}`);
      }

      console.log('✅ User endpoint working:', userResponse.data);
      testResult.success = true;

    } catch (error) {
      testResult.errors.push(error.message);
      console.log('❌ Authentication failed:', error.message);
    }

    this.testResults.push(testResult);
    return testResult;
  }

  async testQuizCreation() {
    console.log('📝 Testing Quiz Creation...');
    
    const testResult = {
      name: 'Quiz Creation',
      steps: [],
      success: false,
      errors: [],
      createdQuizId: null
    };

    try {
      testResult.steps.push('Creating quiz');
      
      const quizData = {
        title: 'Bob Test Quiz',
        description: 'Automated test quiz created by Bob',
        questionCount: 5,
        categories: ['dangerous-goods', 'loadmaster-fundamentals'],
        isActive: true,
        expiresAt: null
      };

      const createResponse = await this.makeRequest('/api/quizzes', {
        method: 'POST',
        body: quizData
      });

      if (!createResponse.success) {
        throw new Error(`Quiz creation failed: ${createResponse.status} - ${JSON.stringify(createResponse.data)}`);
      }

      console.log('✅ Quiz created successfully:', createResponse.data);
      testResult.createdQuizId = createResponse.data.id;
      testResult.success = true;

    } catch (error) {
      testResult.errors.push(error.message);
      console.log('❌ Quiz creation failed:', error.message);
    }

    this.testResults.push(testResult);
    return testResult;
  }

  async testQuizList() {
    console.log('📋 Testing Quiz List...');
    
    const testResult = {
      name: 'Quiz List',
      steps: [],
      success: false,
      errors: [],
      quizCount: 0
    };

    try {
      testResult.steps.push('Fetching quiz list');
      
      const listResponse = await this.makeRequest('/api/quizzes');

      if (!listResponse.success) {
        throw new Error(`Quiz list failed: ${listResponse.status}`);
      }

      const quizzes = listResponse.data;
      testResult.quizCount = Array.isArray(quizzes) ? quizzes.length : 0;
      
      console.log(`✅ Quiz list retrieved: ${testResult.quizCount} quizzes found`);
      testResult.success = true;

    } catch (error) {
      testResult.errors.push(error.message);
      console.log('❌ Quiz list failed:', error.message);
    }

    this.testResults.push(testResult);
    return testResult;
  }

  async testQuizEdit(quizId) {
    console.log(`✏️ Testing Quiz Edit for ID: ${quizId}...`);
    
    const testResult = {
      name: 'Quiz Edit',
      steps: [],
      success: false,
      errors: []
    };

    try {
      if (!quizId) {
        throw new Error('No quiz ID provided for editing');
      }

      // First get the quiz
      testResult.steps.push('Fetching quiz for edit');
      const getResponse = await this.makeRequest(`/api/quizzes/${quizId}`);

      if (!getResponse.success) {
        throw new Error(`Failed to fetch quiz: ${getResponse.status}`);
      }

      // Update the quiz
      testResult.steps.push('Updating quiz');
      const updateData = {
        ...getResponse.data,
        title: 'Bob Updated Quiz',
        description: 'Quiz updated by Bob automated test'
      };

      const updateResponse = await this.makeRequest(`/api/quizzes/${quizId}`, {
        method: 'PUT',
        body: updateData
      });

      if (!updateResponse.success) {
        throw new Error(`Quiz update failed: ${updateResponse.status} - ${JSON.stringify(updateResponse.data)}`);
      }

      console.log('✅ Quiz updated successfully');
      testResult.success = true;

    } catch (error) {
      testResult.errors.push(error.message);
      console.log('❌ Quiz edit failed:', error.message);
    }

    this.testResults.push(testResult);
    return testResult;
  }

  async testQuizDeletion(quizId) {
    console.log(`🗑️ Testing Quiz Deletion for ID: ${quizId}...`);
    
    const testResult = {
      name: 'Quiz Deletion',
      steps: [],
      success: false,
      errors: []
    };

    try {
      if (!quizId) {
        throw new Error('No quiz ID provided for deletion');
      }

      testResult.steps.push('Deleting quiz');
      const deleteResponse = await this.makeRequest(`/api/quizzes/${quizId}`, {
        method: 'DELETE'
      });

      if (!deleteResponse.success) {
        throw new Error(`Quiz deletion failed: ${deleteResponse.status} - ${JSON.stringify(deleteResponse.data)}`);
      }

      // Verify deletion
      testResult.steps.push('Verifying deletion');
      const verifyResponse = await this.makeRequest(`/api/quizzes/${quizId}`);

      if (verifyResponse.success) {
        throw new Error('Quiz still exists after deletion');
      }

      console.log('✅ Quiz deleted successfully');
      testResult.success = true;

    } catch (error) {
      testResult.errors.push(error.message);
      console.log('❌ Quiz deletion failed:', error.message);
    }

    this.testResults.push(testResult);
    return testResult;
  }

  async runCompleteWorkflow() {
    console.log('🚀 BOB COMPLETE QUIZ WORKFLOW TEST');
    console.log('='.repeat(50));

    // Step 1: Authentication
    const authResult = await this.testAuthentication();
    if (!authResult.success) {
      console.log('❌ Cannot proceed without authentication');
      return this.generateReport();
    }

    // Step 2: Quiz Creation
    const createResult = await this.testQuizCreation();
    const quizId = createResult.createdQuizId;

    // Step 3: Quiz List
    await this.testQuizList();

    // Step 4: Quiz Edit (if quiz was created)
    if (quizId) {
      await this.testQuizEdit(quizId);
    }

    // Step 5: Quiz Deletion (if quiz was created)
    if (quizId) {
      await this.testQuizDeletion(quizId);
    }

    return this.generateReport();
  }

  generateReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.success).length;
    const failedTests = totalTests - passedTests;

    const report = {
      summary: {
        totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
      },
      tests: this.testResults,
      timestamp: new Date().toISOString()
    };

    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(30));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${report.summary.successRate}%`);

    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults.filter(t => !t.success).forEach(test => {
        console.log(`   - ${test.name}: ${test.errors.join(', ')}`);
      });
    }

    // Save report
    const reportPath = path.join(this.bobPath, 'test-reports', `workflow-test-${Date.now()}.json`);
    this.ensureDirectory(path.dirname(reportPath));
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved: ${reportPath}`);

    return report;
  }

  ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

async function main() {
  const bob = new BobSimpleTester();
  
  try {
    const report = await bob.runCompleteWorkflow();
    
    if (report.summary.successRate < 100) {
      console.log('\n🔧 Issues detected. Ready for systematic fixes...');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed! Quiz workflow is fully functional.');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

export default BobSimpleTester;

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
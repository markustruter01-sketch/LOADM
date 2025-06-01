#!/usr/bin/env node

// BOB BROWSER TESTER - Frontend Interaction & Testing Module
// Automated UI testing and feature validation

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BobBrowserTester {
  constructor() {
    this.projectPath = path.resolve(__dirname, '..');
    this.bobPath = __dirname;
    this.testResults = [];
    this.screenshots = [];
    this.baseUrl = 'http://localhost:5000';
  }

  // ================== BROWSER AUTOMATION ==================

  async launchBrowser() {
    try {
      // Try to import playwright
      const { chromium } = await import('playwright');
      
      this.browser = await chromium.launch({ 
        headless: false, // Show browser for debugging
        slowMo: 1000 // Slow down for visibility
      });
      
      this.page = await this.browser.newPage();
      
      // Set up error monitoring
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('🔴 Browser Error:', msg.text());
        }
      });
      
      this.page.on('pageerror', error => {
        console.log('🔴 Page Error:', error.message);
      });
      
      console.log('🌐 Browser launched successfully');
      return true;
    } catch (error) {
      console.log('❌ Playwright not available. Installing fallback browser automation...');
      return await this.setupFallbackBrowser();
    }
  }

  async setupFallbackBrowser() {
    try {
      // Try puppeteer as fallback
      const puppeteer = await import('puppeteer');
      
      this.browser = await puppeteer.launch({ 
        headless: false,
        slowMo: 1000,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      this.page = await this.browser.newPage();
      
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('🔴 Browser Error:', msg.text());
        }
      });
      
      console.log('🌐 Fallback browser (Puppeteer) launched');
      return true;
    } catch (error) {
      console.log('❌ No browser automation available. Please install playwright or puppeteer');
      return false;
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      console.log('🌐 Browser closed');
    }
  }

  // ================== UI INTERACTION METHODS ==================

  async navigateTo(path = '/') {
    const url = `${this.baseUrl}${path}`;
    console.log(`🧭 Navigating to ${url}`);
    
    try {
      await this.page.goto(url, { waitUntil: 'networkidle' });
      await this.takeScreenshot(`navigation-${path.replace(/\//g, '-')}`);
      return true;
    } catch (error) {
      console.log(`❌ Navigation failed: ${error.message}`);
      return false;
    }
  }

  async clickButton(selector, description = '') {
    console.log(`🖱️ Clicking button: ${description || selector}`);
    
    try {
      await this.page.waitForSelector(selector, { timeout: 5000 });
      await this.page.click(selector);
      await this.page.waitForTimeout(1000); // Wait for action to complete
      await this.takeScreenshot(`click-${description.replace(/\s+/g, '-')}`);
      return true;
    } catch (error) {
      console.log(`❌ Click failed: ${error.message}`);
      return false;
    }
  }

  async fillForm(formData) {
    console.log('📝 Filling form with data...');
    
    try {
      for (const [selector, value] of Object.entries(formData)) {
        await this.page.waitForSelector(selector, { timeout: 5000 });
        
        // Clear existing content first
        await this.page.click(selector, { clickCount: 3 });
        await this.page.keyboard.press('Backspace');
        
        // Fill with new value
        await this.page.type(selector, value, { delay: 100 });
        console.log(`   ✓ Filled ${selector}: ${value}`);
      }
      
      await this.takeScreenshot('form-filled');
      return true;
    } catch (error) {
      console.log(`❌ Form filling failed: ${error.message}`);
      return false;
    }
  }

  async selectOption(selector, value, description = '') {
    console.log(`📋 Selecting option: ${description || selector} = ${value}`);
    
    try {
      await this.page.waitForSelector(selector, { timeout: 5000 });
      await this.page.selectOption(selector, value);
      await this.takeScreenshot(`select-${description.replace(/\s+/g, '-')}`);
      return true;
    } catch (error) {
      console.log(`❌ Selection failed: ${error.message}`);
      return false;
    }
  }

  async checkCheckbox(selector, description = '') {
    console.log(`☑️ Checking checkbox: ${description || selector}`);
    
    try {
      await this.page.waitForSelector(selector, { timeout: 5000 });
      await this.page.check(selector);
      await this.takeScreenshot(`check-${description.replace(/\s+/g, '-')}`);
      return true;
    } catch (error) {
      console.log(`❌ Checkbox check failed: ${error.message}`);
      return false;
    }
  }

  async waitForText(text, timeout = 10000) {
    console.log(`⏳ Waiting for text: "${text}"`);
    
    try {
      await this.page.waitForFunction(
        (searchText) => document.body.innerText.includes(searchText),
        { timeout },
        text
      );
      await this.takeScreenshot(`text-found-${text.replace(/\s+/g, '-')}`);
      return true;
    } catch (error) {
      console.log(`❌ Text not found: ${error.message}`);
      return false;
    }
  }

  async waitForElement(selector, timeout = 10000) {
    console.log(`⏳ Waiting for element: ${selector}`);
    
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.log(`❌ Element not found: ${error.message}`);
      return false;
    }
  }

  async takeScreenshot(name) {
    try {
      const screenshotDir = path.join(this.bobPath, 'screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      
      const screenshotPath = path.join(screenshotDir, `${name}-${Date.now()}.png`);
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      
      this.screenshots.push({
        name,
        path: screenshotPath,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📸 Screenshot saved: ${name}`);
    } catch (error) {
      console.log(`❌ Screenshot failed: ${error.message}`);
    }
  }

  // ================== COMPREHENSIVE TEST SCENARIOS ==================

  async testQuizCreationWorkflow() {
    console.log('🧪 TESTING: Complete Quiz Creation Workflow');
    console.log('-'.repeat(50));
    
    const testResult = {
      name: 'Quiz Creation Workflow',
      steps: [],
      success: false,
      errors: [],
      duration: 0
    };
    
    const startTime = Date.now();
    
    try {
      // Step 1: Navigate to home page
      testResult.steps.push('Navigate to home page');
      const homeNavigation = await this.navigateTo('/');
      if (!homeNavigation) throw new Error('Home page navigation failed');
      
      // Step 2: Check if login is needed
      testResult.steps.push('Check authentication status');
      const loginNeeded = await this.page.$('text=Login') !== null;
      
      if (loginNeeded) {
        // Step 3: Login
        testResult.steps.push('Perform login');
        await this.clickButton('text=Login', 'login-button');
        
        await this.fillForm({
          'input[name="username"]': 'markustruter01@gmail.com',
          'input[name="password"]': 'password123'
        });
        
        await this.clickButton('button[type="submit"]', 'login-submit');
        await this.waitForText('Welcome', 5000);
      }
      
      // Step 4: Navigate to quiz creation
      testResult.steps.push('Navigate to quiz creation');
      const quizNavigation = await this.navigateTo('/instructors-portal/quizzes/create');
      if (!quizNavigation) throw new Error('Quiz creation page navigation failed');
      
      // Step 5: Fill quiz form
      testResult.steps.push('Fill quiz creation form');
      await this.fillForm({
        'input[name="title"]': 'Bob Test Quiz',
        'textarea[name="description"]': 'Automated test quiz created by Bob'
      });
      
      // Step 6: Select question count
      testResult.steps.push('Select question count');
      await this.selectOption('select[name="questionCount"]', '5', 'question-count');
      
      // Step 7: Select categories
      testResult.steps.push('Select quiz categories');
      await this.checkCheckbox('input[value="dangerous-goods"]', 'dangerous-goods-category');
      await this.checkCheckbox('input[value="loadmaster-fundamentals"]', 'fundamentals-category');
      
      // Step 8: Submit quiz
      testResult.steps.push('Submit quiz');
      await this.clickButton('button[type="submit"]', 'submit-quiz');
      
      // Step 9: Verify success
      testResult.steps.push('Verify quiz creation success');
      const successFound = await this.waitForText('Quiz created successfully', 10000);
      if (!successFound) throw new Error('Success message not found');
      
      testResult.success = true;
      testResult.duration = Date.now() - startTime;
      
      console.log('✅ Quiz creation workflow completed successfully');
      
    } catch (error) {
      testResult.errors.push(error.message);
      testResult.duration = Date.now() - startTime;
      console.log('❌ Quiz creation workflow failed:', error.message);
    }
    
    this.testResults.push(testResult);
    return testResult;
  }

  async testQuizDeletionWorkflow() {
    console.log('🧪 TESTING: Quiz Deletion Workflow');
    console.log('-'.repeat(50));
    
    const testResult = {
      name: 'Quiz Deletion Workflow',
      steps: [],
      success: false,
      errors: [],
      duration: 0
    };
    
    const startTime = Date.now();
    
    try {
      // Step 1: Navigate to quiz list
      testResult.steps.push('Navigate to quiz list');
      const listNavigation = await this.navigateTo('/instructors-portal/quizzes');
      if (!listNavigation) throw new Error('Quiz list navigation failed');
      
      // Step 2: Find and click delete button
      testResult.steps.push('Click delete button');
      const deleteButtonExists = await this.waitForElement('button[aria-label*="Delete"]', 5000);
      if (!deleteButtonExists) throw new Error('No delete button found');
      
      await this.clickButton('button[aria-label*="Delete"]', 'delete-quiz-button');
      
      // Step 3: Confirm deletion
      testResult.steps.push('Confirm deletion');
      await this.waitForElement('text=Delete', 3000);
      await this.clickButton('text=Delete', 'confirm-delete');
      
      // Step 4: Verify deletion success
      testResult.steps.push('Verify deletion success');
      const deletionSuccess = await this.waitForText('Quiz deleted', 10000);
      if (!deletionSuccess) throw new Error('Deletion success message not found');
      
      testResult.success = true;
      testResult.duration = Date.now() - startTime;
      
      console.log('✅ Quiz deletion workflow completed successfully');
      
    } catch (error) {
      testResult.errors.push(error.message);
      testResult.duration = Date.now() - startTime;
      console.log('❌ Quiz deletion workflow failed:', error.message);
    }
    
    this.testResults.push(testResult);
    return testResult;
  }

  async testAuthenticationFlow() {
    console.log('🧪 TESTING: Authentication Flow');
    console.log('-'.repeat(50));
    
    const testResult = {
      name: 'Authentication Flow',
      steps: [],
      success: false,
      errors: [],
      duration: 0
    };
    
    const startTime = Date.now();
    
    try {
      // Test invalid login first
      testResult.steps.push('Test invalid login');
      await this.navigateTo('/');
      await this.clickButton('text=Login', 'login-button');
      
      await this.fillForm({
        'input[name="username"]': 'invalid@example.com',
        'input[name="password"]': 'wrongpassword'
      });
      
      await this.clickButton('button[type="submit"]', 'invalid-login-submit');
      
      const errorFound = await this.waitForText('Login failed', 5000);
      if (!errorFound) throw new Error('Login error message not displayed');
      
      // Test valid login
      testResult.steps.push('Test valid login');
      await this.fillForm({
        'input[name="username"]': 'markustruter01@gmail.com',
        'input[name="password"]': 'password123'
      });
      
      await this.clickButton('button[type="submit"]', 'valid-login-submit');
      
      const loginSuccess = await this.waitForText('Welcome', 10000);
      if (!loginSuccess) throw new Error('Login success not confirmed');
      
      testResult.success = true;
      testResult.duration = Date.now() - startTime;
      
      console.log('✅ Authentication flow completed successfully');
      
    } catch (error) {
      testResult.errors.push(error.message);
      testResult.duration = Date.now() - startTime;
      console.log('❌ Authentication flow failed:', error.message);
    }
    
    this.testResults.push(testResult);
    return testResult;
  }

  async testResponsiveDesign() {
    console.log('🧪 TESTING: Responsive Design');
    console.log('-'.repeat(50));
    
    const testResult = {
      name: 'Responsive Design',
      steps: [],
      success: false,
      errors: [],
      duration: 0
    };
    
    const startTime = Date.now();
    
    try {
      const viewports = [
        { name: 'Mobile', width: 375, height: 667 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Desktop', width: 1920, height: 1080 }
      ];
      
      for (const viewport of viewports) {
        testResult.steps.push(`Test ${viewport.name} viewport`);
        
        await this.page.setViewportSize({ 
          width: viewport.width, 
          height: viewport.height 
        });
        
        await this.navigateTo('/');
        await this.takeScreenshot(`responsive-${viewport.name.toLowerCase()}`);
        
        // Check if navigation is accessible
        const navExists = await this.page.$('nav') !== null;
        if (!navExists) throw new Error(`Navigation not found on ${viewport.name}`);
      }
      
      testResult.success = true;
      testResult.duration = Date.now() - startTime;
      
      console.log('✅ Responsive design test completed successfully');
      
    } catch (error) {
      testResult.errors.push(error.message);
      testResult.duration = Date.now() - startTime;
      console.log('❌ Responsive design test failed:', error.message);
    }
    
    this.testResults.push(testResult);
    return testResult;
  }

  async testPerformance() {
    console.log('🧪 TESTING: Performance Metrics');
    console.log('-'.repeat(50));
    
    const testResult = {
      name: 'Performance Test',
      steps: [],
      success: false,
      errors: [],
      duration: 0,
      metrics: {}
    };
    
    const startTime = Date.now();
    
    try {
      // Enable performance monitoring
      await this.page.coverage.startJSCoverage();
      await this.page.coverage.startCSSCoverage();
      
      testResult.steps.push('Measure page load time');
      const navigationStart = Date.now();
      await this.navigateTo('/');
      const navigationEnd = Date.now();
      
      testResult.metrics.pageLoadTime = navigationEnd - navigationStart;
      
      // Measure performance metrics
      const performanceMetrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        };
      });
      
      testResult.metrics = { ...testResult.metrics, ...performanceMetrics };
      
      // Stop coverage and analyze
      const jsCoverage = await this.page.coverage.stopJSCoverage();
      const cssCoverage = await this.page.coverage.stopCSSCoverage();
      
      const jsUsage = jsCoverage.reduce((total, entry) => {
        return total + entry.ranges.reduce((sum, range) => sum + range.end - range.start, 0);
      }, 0);
      
      const cssUsage = cssCoverage.reduce((total, entry) => {
        return total + entry.ranges.reduce((sum, range) => sum + range.end - range.start, 0);
      }, 0);
      
      testResult.metrics.jsUsage = jsUsage;
      testResult.metrics.cssUsage = cssUsage;
      
      testResult.success = true;
      testResult.duration = Date.now() - startTime;
      
      console.log('✅ Performance test completed');
      console.log(`   Page Load: ${testResult.metrics.pageLoadTime}ms`);
      console.log(`   DOM Content Loaded: ${testResult.metrics.domContentLoaded}ms`);
      console.log(`   First Contentful Paint: ${testResult.metrics.firstContentfulPaint}ms`);
      
    } catch (error) {
      testResult.errors.push(error.message);
      testResult.duration = Date.now() - startTime;
      console.log('❌ Performance test failed:', error.message);
    }
    
    this.testResults.push(testResult);
    return testResult;
  }

  // ================== COMPREHENSIVE TEST RUNNER ==================

  async runAllTests() {
    console.log('🚀 BOB BROWSER TESTER - COMPREHENSIVE UI TESTING');
    console.log('='.repeat(60));
    
    const browserReady = await this.launchBrowser();
    if (!browserReady) {
      console.log('❌ Cannot run tests without browser automation');
      return { success: false, error: 'Browser automation not available' };
    }
    
    try {
      // Run all test suites
      await this.testAuthenticationFlow();
      await this.testQuizCreationWorkflow();
      await this.testQuizDeletionWorkflow();
      await this.testResponsiveDesign();
      await this.testPerformance();
      
      // Generate comprehensive report
      const report = this.generateTestReport();
      
      // Save report
      const reportPath = path.join(this.bobPath, 'test-reports', `ui-test-${Date.now()}.json`);
      this.ensureDirectory(path.dirname(reportPath));
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      console.log('\n📊 TEST SUMMARY');
      console.log('='.repeat(30));
      console.log(`Total Tests: ${this.testResults.length}`);
      console.log(`Passed: ${this.testResults.filter(t => t.success).length}`);
      console.log(`Failed: ${this.testResults.filter(t => !t.success).length}`);
      console.log(`Screenshots: ${this.screenshots.length}`);
      console.log(`Report saved: ${reportPath}`);
      
      return report;
      
    } catch (error) {
      console.log('❌ Test execution failed:', error.message);
      return { success: false, error: error.message };
    } finally {
      await this.closeBrowser();
    }
  }

  generateTestReport() {
    return {
      summary: {
        totalTests: this.testResults.length,
        passed: this.testResults.filter(t => t.success).length,
        failed: this.testResults.filter(t => !t.success).length,
        totalDuration: this.testResults.reduce((sum, t) => sum + t.duration, 0),
        screenshotCount: this.screenshots.length
      },
      tests: this.testResults,
      screenshots: this.screenshots,
      timestamp: new Date().toISOString(),
      browserInfo: {
        userAgent: 'Chrome/Playwright',
        viewport: '1920x1080'
      }
    };
  }

  ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // ================== INTERACTIVE TESTING MODE ==================

  async interactiveMode() {
    console.log('🎮 BOB INTERACTIVE MODE - Manual Browser Control');
    console.log('Available commands:');
    console.log('  navigate [path] - Navigate to page');
    console.log('  click [selector] - Click element');
    console.log('  fill [selector] [value] - Fill input');
    console.log('  screenshot [name] - Take screenshot');
    console.log('  wait [text] - Wait for text to appear');
    console.log('  test [workflow] - Run specific test');
    console.log('  exit - Close browser and exit');
    
    const browserReady = await this.launchBrowser();
    if (!browserReady) return;
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const processCommand = async (command) => {
      const [cmd, ...args] = command.trim().split(' ');
      
      switch (cmd) {
        case 'navigate':
          await this.navigateTo(args[0] || '/');
          break;
        case 'click':
          await this.clickButton(args[0], args.slice(1).join(' '));
          break;
        case 'fill':
          await this.fillForm({ [args[0]]: args.slice(1).join(' ') });
          break;
        case 'screenshot':
          await this.takeScreenshot(args[0] || 'manual');
          break;
        case 'wait':
          await this.waitForText(args.join(' '));
          break;
        case 'test':
          const workflow = args[0];
          if (workflow === 'quiz') await this.testQuizCreationWorkflow();
          else if (workflow === 'auth') await this.testAuthenticationFlow();
          else console.log('Available tests: quiz, auth');
          break;
        case 'exit':
          await this.closeBrowser();
          rl.close();
          return;
        default:
          console.log('Unknown command. Type "exit" to quit.');
      }
      
      rl.prompt();
    };
    
    rl.on('line', processCommand);
    rl.prompt();
  }
}

// ================== CLI INTERFACE ==================

async function main() {
  const command = process.argv[2] || 'test';
  const bob = new BobBrowserTester();
  
  console.log('🤖 BOB BROWSER TESTER v1.0');
  console.log('='.repeat(40));
  
  try {
    switch (command) {
      case 'test':
        await bob.runAllTests();
        break;
      case 'interactive':
        await bob.interactiveMode();
        break;
      case 'quiz':
        const browserReady = await bob.launchBrowser();
        if (browserReady) {
          await bob.testQuizCreationWorkflow();
          await bob.closeBrowser();
        }
        break;
      case 'auth':
        const authBrowserReady = await bob.launchBrowser();
        if (authBrowserReady) {
          await bob.testAuthenticationFlow();
          await bob.closeBrowser();
        }
        break;
      default:
        console.log('Commands: test, interactive, quiz, auth');
    }
  } catch (error) {
    console.error('❌ Bob Browser Tester error:', error.message);
  }
}

export default BobBrowserTester;

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
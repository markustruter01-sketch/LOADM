import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BobDocumentTester {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async initialize() {
    console.log('🚀 BOB DOCUMENT TESTING SYSTEM STARTING...');
    this.browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1200, height: 800 }
    });
    this.page = await this.browser.newPage();
    
    // Set up console logging
    this.page.on('console', msg => {
      console.log('🖥️ Browser Console:', msg.text());
    });
    
    // Set up error logging
    this.page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });
  }

  async loginToSystem() {
    console.log('🔐 Logging into the system...');
    
    try {
      await this.page.goto(`${this.baseUrl}/login`);
      await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });
      
      await this.page.type('input[type="email"]', 'markustruter01@gmail.com');
      await this.page.type('input[type="password"]', 'Skating69!');
      
      await this.page.click('button[type="submit"]');
      await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
      
      console.log('✅ Successfully logged in');
      return true;
    } catch (error) {
      console.log('❌ Login failed:', error.message);
      return false;
    }
  }

  async navigateToDocuments() {
    console.log('📄 Navigating to Documents section...');
    
    try {
      await this.page.goto(`${this.baseUrl}/documents`);
      await this.page.waitForSelector('h1', { timeout: 10000 });
      
      const pageTitle = await this.page.$eval('h1', el => el.textContent);
      console.log('📍 Current page title:', pageTitle);
      
      return true;
    } catch (error) {
      console.log('❌ Failed to navigate to documents:', error.message);
      return false;
    }
  }

  async testDocumentRoutes() {
    console.log('🔍 Testing all document routes...');
    
    const documentRoutes = [
      { name: 'Load Planning Form', path: '/cargo-manifest#load-planning-form' },
      { name: 'Passenger/Crew Manifest', path: '/cargo-manifest#cargo-manifest-form' },
      { name: 'Dangerous Goods Declaration', path: '/cargo-manifest#dangerous-goods-declaration-form' },
      { name: 'Weight & Balance Sheet', path: '/cargo-manifest#weight-balance-sheet-form' },
      { name: 'Special Handling Form', path: '/cargo-manifest#special-handling-form' },
      { name: 'Aircraft Tie-Down Diagram', path: '/cargo-manifest#tie-down-diagram-form' },
      { name: 'Cargo Compatibility Checklist', path: '/cargo-manifest#compatibility-checklist-form' },
      { name: 'Shoring Requirements Worksheet', path: '/cargo-manifest#shoring-worksheet-form' },
      { name: 'Hazard Certification Form', path: '/cargo-manifest#hazard-certification-form' },
      { name: 'Aircraft Loading Deviation Request', path: '/cargo-manifest#loading-deviation-form' }
    ];

    for (const doc of documentRoutes) {
      console.log(`\n🧪 Testing: ${doc.name}`);
      
      try {
        // Navigate to the document
        await this.page.goto(`${this.baseUrl}${doc.path}`);
        await this.page.waitForTimeout(2000);
        
        // Check for errors
        const errorElement = await this.page.$('text="Document not found"');
        if (errorElement) {
          console.log(`❌ ${doc.name}: Document not found error`);
          this.testResults.push({ name: doc.name, status: 'ERROR', issue: 'Document not found' });
          continue;
        }
        
        // Check if the form section exists
        const formId = doc.path.split('#')[1];
        const formSection = await this.page.$(`#${formId}`);
        
        if (formSection) {
          console.log(`✅ ${doc.name}: Form section found`);
          
          // Scroll to the form
          await this.page.evaluate((id) => {
            const element = document.getElementById(id);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }, formId);
          
          await this.page.waitForTimeout(1000);
          
          // Check for form content
          const formContent = await this.page.$eval(`#${formId}`, el => el.innerHTML.length);
          if (formContent > 100) {
            console.log(`✅ ${doc.name}: Form content loaded (${formContent} chars)`);
            this.testResults.push({ name: doc.name, status: 'SUCCESS', contentLength: formContent });
          } else {
            console.log(`⚠️ ${doc.name}: Form content too small (${formContent} chars)`);
            this.testResults.push({ name: doc.name, status: 'WARNING', issue: 'Content too small', contentLength: formContent });
          }
        } else {
          console.log(`❌ ${doc.name}: Form section not found`);
          this.testResults.push({ name: doc.name, status: 'ERROR', issue: 'Form section missing' });
        }
        
      } catch (error) {
        console.log(`❌ ${doc.name}: Error - ${error.message}`);
        this.testResults.push({ name: doc.name, status: 'ERROR', issue: error.message });
      }
    }
  }

  async testDocumentLinks() {
    console.log('\n🔗 Testing document links from Documents page...');
    
    try {
      await this.page.goto(`${this.baseUrl}/documents`);
      await this.page.waitForSelector('[data-testid="documents-tab"], .documents-section, .grid', { timeout: 10000 });
      
      // Look for document cards or links
      const documentLinks = await this.page.$$eval('a', links => 
        links.filter(link => link.href.includes('cargo-manifest'))
             .map(link => ({ text: link.textContent.trim(), href: link.href }))
      );
      
      console.log(`Found ${documentLinks.length} document links`);
      
      for (const link of documentLinks) {
        console.log(`🔗 Testing link: ${link.text} -> ${link.href}`);
        
        try {
          await this.page.goto(link.href);
          await this.page.waitForTimeout(2000);
          
          const title = await this.page.title();
          console.log(`✅ Link works: ${title}`);
        } catch (error) {
          console.log(`❌ Link failed: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.log('❌ Failed to test document links:', error.message);
    }
  }

  generateReport() {
    console.log('\n📊 DOCUMENT TESTING REPORT');
    console.log('='.repeat(50));
    
    const successful = this.testResults.filter(r => r.status === 'SUCCESS');
    const warnings = this.testResults.filter(r => r.status === 'WARNING');
    const errors = this.testResults.filter(r => r.status === 'ERROR');
    
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`⚠️ Warnings: ${warnings.length}`);
    console.log(`❌ Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ FAILED DOCUMENTS:');
      errors.forEach(result => {
        console.log(`   - ${result.name}: ${result.issue}`);
      });
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️ WARNING DOCUMENTS:');
      warnings.forEach(result => {
        console.log(`   - ${result.name}: ${result.issue}`);
      });
    }
    
    if (successful.length > 0) {
      console.log('\n✅ WORKING DOCUMENTS:');
      successful.forEach(result => {
        console.log(`   - ${result.name}: Content loaded (${result.contentLength} chars)`);
      });
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'test-reports', `document-test-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results: this.testResults,
      summary: {
        total: this.testResults.length,
        successful: successful.length,
        warnings: warnings.length,
        errors: errors.length
      }
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runFullTest() {
    try {
      await this.initialize();
      
      const loginSuccess = await this.loginToSystem();
      if (!loginSuccess) {
        console.log('❌ Cannot proceed without login');
        return;
      }
      
      await this.navigateToDocuments();
      await this.testDocumentRoutes();
      await this.testDocumentLinks();
      
      this.generateReport();
      
    } catch (error) {
      console.log('❌ Test execution failed:', error.message);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test
async function main() {
  const tester = new BobDocumentTester();
  await tester.runFullTest();
}

main().catch(console.error);
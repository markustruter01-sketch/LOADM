import puppeteer from 'puppeteer';

class BobPDFTester {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async init() {
    this.log('Initializing Bob PDF Test...');
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Set up console monitoring
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.log(`Browser Console Error: ${msg.text()}`, 'error');
      }
    });
  }

  async login() {
    this.log('Navigating to login page...');
    await this.page.goto('http://localhost:5000/login');
    await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    this.log('Logging in as superadmin...');
    await this.page.type('input[type="email"]', 'markustruter01@gmail.com');
    await this.page.type('input[type="password"]', 'password123');
    await this.page.click('button[type="submit"]');
    
    await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
    this.log('Login successful', 'success');
  }

  async navigateToDocuments() {
    this.log('Navigating to Documents page...');
    await this.page.goto('http://localhost:5000/documents');
    await this.page.waitForSelector('[data-testid="documents-tab"], .documents-tab, h1:contains("Documents")', { timeout: 10000 });
    this.log('Documents page loaded', 'success');
  }

  async testPDFDocuments() {
    this.log('Testing PDF document display...');
    
    // Wait for document cards to load
    await this.page.waitForSelector('[class*="grid"]', { timeout: 10000 });
    
    // Look for PDF document cards
    const documentCards = await this.page.$$('[class*="card"], [class*="document"]');
    this.log(`Found ${documentCards.length} document cards`);
    
    // Check for specific PDF documents
    const pageContent = await this.page.content();
    const hasPassengerManifest = pageContent.includes('Passenger and Cargo Manifest');
    const hasDGChecklist = pageContent.includes('Dangerous Goods Checklist');
    
    this.log(`Passenger Manifest found: ${hasPassengerManifest}`, hasPassengerManifest ? 'success' : 'error');
    this.log(`DG Checklist found: ${hasDGChecklist}`, hasDGChecklist ? 'success' : 'error');
    
    // Try to click on the first PDF document
    if (documentCards.length > 0) {
      this.log('Clicking on first PDF document...');
      await documentCards[0].click();
      
      // Wait for PDF viewer to appear
      await this.page.waitForTimeout(2000);
      
      // Check for iframe (actual PDF) vs placeholder content
      const iframe = await this.page.$('iframe[src*="data:application/pdf"]');
      const placeholderElements = await this.page.$$eval('*', els => 
        els.filter(el => el.textContent && el.textContent.includes('PDF Document Ready')).length
      );
      
      if (iframe) {
        this.log('✅ ACTUAL PDF FOUND! PDF is displaying correctly', 'success');
        
        // Get iframe src to verify it contains base64 PDF data
        const iframeSrc = await this.page.evaluate(el => el.src, iframe);
        const hasBase64PDF = iframeSrc.startsWith('data:application/pdf;base64,') && 
                             iframeSrc.length > 100 && 
                             !iframeSrc.includes('sample_pdf_data_placeholder');
        
        this.log(`PDF contains actual data: ${hasBase64PDF}`, hasBase64PDF ? 'success' : 'error');
        return hasBase64PDF;
      } else if (placeholderElements > 0) {
        this.log('❌ PLACEHOLDER CONTENT STILL SHOWING', 'error');
        return false;
      } else {
        this.log('PDF viewer state unclear', 'error');
        return false;
      }
    }
    
    return false;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();
      await this.login();
      await this.navigateToDocuments();
      const success = await this.testPDFDocuments();
      
      if (success) {
        this.log('🎉 BOB CONFIRMS: PDF DOCUMENTS ARE WORKING CORRECTLY!', 'success');
      } else {
        this.log('❌ BOB REPORTS: PDF DOCUMENTS STILL SHOWING PLACEHOLDERS', 'error');
      }
      
      return success;
    } catch (error) {
      this.log(`Test failed: ${error.message}`, 'error');
      return false;
    } finally {
      await this.close();
    }
  }
}

const tester = new BobPDFTester();
tester.run().then(success => {
  process.exit(success ? 0 : 1);
});
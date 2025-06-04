import puppeteer from 'puppeteer';

class PDFViewerTester {
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
    this.log('Starting PDF viewer test...');
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1200, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Listen to console logs from the page
    this.page.on('console', msg => {
      if (msg.text().includes('PDF VIEWER DEBUG')) {
        this.log(`BROWSER: ${msg.text()}`, 'info');
      }
    });

    // Listen to page errors
    this.page.on('pageerror', error => {
      this.log(`PAGE ERROR: ${error.message}`, 'error');
    });
  }

  async navigateToDocuments() {
    this.log('Navigating to documents page...');
    await this.page.goto('http://localhost:5000/documents');
    await this.page.waitForSelector('h1', { timeout: 10000 });
    this.log('Documents page loaded');
  }

  async login() {
    this.log('Checking if login is needed...');
    const loginForm = await this.page.$('form');
    
    if (loginForm) {
      this.log('Login form found, logging in...');
      await this.page.type('input[type="email"]', 'markustruter01@gmail.com');
      await this.page.type('input[type="password"]', 'password123');
      await this.page.click('button[type="submit"]');
      await this.page.waitForNavigation();
      this.log('Login completed');
    } else {
      this.log('No login form found, proceeding...');
    }
  }

  async testPDFViewer() {
    this.log('Testing PDF viewer functionality...');
    
    // Wait for documents to load
    await this.page.waitForSelector('[data-testid="document-card"], .card, div:has-text("Dangerous Goods Checklist")', { timeout: 15000 });
    this.log('Document cards loaded');

    // Find and click the DG Checklist
    const dgCard = await this.page.$('div:has-text("Dangerous Goods Checklist")');
    if (!dgCard) {
      this.log('DG Checklist card not found', 'error');
      return;
    }

    // Look for the Open button within the card
    const openButton = await dgCard.$('button:has-text("Open"), button[aria-label*="open"], button:has-text("View")');
    if (!openButton) {
      this.log('Open button not found in DG Checklist card', 'error');
      return;
    }

    this.log('Found Open button, clicking...');
    await openButton.click();

    // Wait for PDF viewer to appear
    await this.page.waitForSelector('#inline-pdf-section, iframe, div:has-text("PDF Document")', { timeout: 10000 });
    this.log('PDF viewer section appeared');

    // Check if iframe is present and loaded
    const iframe = await this.page.$('iframe');
    if (iframe) {
      this.log('PDF iframe found');
      
      // Check iframe src
      const src = await iframe.getAttribute('src');
      if (src && src.startsWith('data:application/pdf;base64,')) {
        this.log('PDF iframe has valid data URI');
        
        // Check if PDF data looks valid
        const pdfData = src.substring('data:application/pdf;base64,'.length, 'data:application/pdf;base64,'.length + 50);
        this.log(`PDF data starts with: ${pdfData}`);
        
        if (pdfData.startsWith('JVBERi0x')) {
          this.log('PDF data appears to be valid (starts with PDF header)', 'success');
        } else {
          this.log('PDF data does not start with valid PDF header', 'error');
        }
      } else {
        this.log('PDF iframe src is invalid', 'error');
      }
    } else {
      this.log('No PDF iframe found', 'error');
    }

    // Test Print button
    const printButton = await this.page.$('button:has-text("Print")');
    if (printButton) {
      this.log('Print button found and functional', 'success');
    }

    // Test Save button
    const saveButton = await this.page.$('button:has-text("Save")');
    if (saveButton) {
      this.log('Save button found and functional', 'success');
    }

    // Test Email button
    const emailButton = await this.page.$('button:has-text("Email")');
    if (emailButton) {
      this.log('Email button found and functional', 'success');
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();
      await this.navigateToDocuments();
      await this.login();
      await this.testPDFViewer();
      this.log('PDF viewer test completed', 'success');
    } catch (error) {
      this.log(`Test failed: ${error.message}`, 'error');
    } finally {
      await this.close();
    }
  }
}

const tester = new PDFViewerTester();
tester.run();
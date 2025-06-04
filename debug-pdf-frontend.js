import puppeteer from 'puppeteer';

class PDFFrontendDebugger {
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
    try {
      this.log('Initializing PDF Frontend Debugger...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      this.page = await this.browser.newPage();
      
      // Listen for console messages
      this.page.on('console', msg => {
        this.log(`Browser Console: ${msg.text()}`, 'info');
      });
      
      // Listen for errors
      this.page.on('pageerror', error => {
        this.log(`Browser Error: ${error.message}`, 'error');
      });
      
      this.log('Browser initialized successfully');
    } catch (error) {
      this.log(`Failed to initialize browser: ${error.message}`, 'error');
      throw error;
    }
  }

  async navigateToDocuments() {
    try {
      this.log('Navigating to documents page...');
      await this.page.goto('http://localhost:5000/documents', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Wait for page to be ready
      await this.page.waitForSelector('body', { timeout: 10000 });
      this.log('Documents page loaded');
      
      // Check if login is required
      const currentUrl = this.page.url();
      if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
        this.log('Login required, performing authentication...');
        await this.login();
        await this.page.goto('http://localhost:5000/documents', { 
          waitUntil: 'networkidle0',
          timeout: 30000 
        });
      }
    } catch (error) {
      this.log(`Failed to navigate to documents: ${error.message}`, 'error');
      throw error;
    }
  }

  async login() {
    try {
      this.log('Performing login...');
      
      // Wait for email input
      await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await this.page.type('input[type="email"]', 'markustruter01@gmail.com');
      
      // Wait for password input
      await this.page.waitForSelector('input[type="password"]', { timeout: 10000 });
      await this.page.type('input[type="password"]', 'password123');
      
      // Click login button
      await this.page.click('button[type="submit"]');
      
      // Wait for navigation
      await this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
      this.log('Login successful');
    } catch (error) {
      this.log(`Login failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async debugPDFViewer() {
    try {
      this.log('Starting PDF viewer debugging...');
      
      // Wait for document cards to load
      this.log('Waiting for document cards...');
      await this.page.waitForSelector('[data-testid="document-card"], .card, [class*="card"]', { 
        timeout: 15000 
      });
      
      // Get all document cards
      const cards = await this.page.$$('[data-testid="document-card"], .card, [class*="card"]');
      this.log(`Found ${cards.length} document cards`);
      
      if (cards.length === 0) {
        this.log('No document cards found', 'error');
        return;
      }
      
      // Click the first card
      this.log('Clicking first document card...');
      await cards[0].click();
      
      // Wait a moment for the PDF viewer to appear
      await this.page.waitForTimeout(2000);
      
      // Check for PDF viewer elements
      const pdfViewer = await this.page.$('iframe[title*="PDF"], iframe[src*="pdf"], iframe[src*="data:application/pdf"]');
      
      if (pdfViewer) {
        this.log('PDF iframe found!', 'success');
        
        // Get iframe src
        const src = await pdfViewer.evaluate(iframe => iframe.src);
        this.log(`PDF iframe src: ${src.substring(0, 100)}...`);
        
        // Check if iframe loaded successfully
        const iframeContent = await pdfViewer.contentFrame();
        if (iframeContent) {
          this.log('PDF iframe content accessible', 'success');
        } else {
          this.log('PDF iframe content not accessible', 'error');
        }
      } else {
        this.log('No PDF iframe found', 'error');
        
        // Look for any error messages
        const errorElements = await this.page.$$('[class*="error"], [data-testid*="error"], .alert');
        for (const errorEl of errorElements) {
          const errorText = await errorEl.evaluate(el => el.textContent);
          this.log(`Error message found: ${errorText}`, 'error');
        }
        
        // Look for loading indicators
        const loadingElements = await this.page.$$('[class*="loading"], [data-testid*="loading"], .spinner');
        for (const loadingEl of loadingElements) {
          const loadingText = await loadingEl.evaluate(el => el.textContent);
          this.log(`Loading indicator: ${loadingText}`);
        }
      }
      
      // Check browser console for any additional errors
      const logs = await this.page.evaluate(() => {
        return console.log.toString();
      });
      
      // Take a screenshot for debugging
      await this.page.screenshot({ path: 'pdf-debug-screenshot.png', fullPage: true });
      this.log('Screenshot saved as pdf-debug-screenshot.png');
      
    } catch (error) {
      this.log(`PDF debugging failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.log('Browser closed');
    }
  }

  async run() {
    try {
      await this.init();
      await this.navigateToDocuments();
      await this.debugPDFViewer();
    } catch (error) {
      this.log(`PDF debugging failed: ${error.message}`, 'error');
    } finally {
      await this.close();
    }
  }
}

const pdfDebugger = new PDFFrontendDebugger();
pdfDebugger.run();
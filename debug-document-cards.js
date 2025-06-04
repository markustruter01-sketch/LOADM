const puppeteer = require('puppeteer');

class DocumentCardDebugger {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async init() {
    this.log('Initializing browser for document card debugging...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Listen for console logs from the page
    this.page.on('console', msg => {
      this.log(`BROWSER CONSOLE: ${msg.text()}`);
    });
    
    // Listen for page errors
    this.page.on('pageerror', error => {
      this.log(`PAGE ERROR: ${error.message}`, 'error');
    });
  }

  async navigateToDocuments() {
    this.log('Navigating to documents page...');
    try {
      await this.page.goto('http://localhost:5000/documents', { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });
      this.log('Successfully navigated to documents page', 'success');
      
      // Wait for page to load and check if we need to login
      await this.page.waitForTimeout(2000);
      
      const currentUrl = this.page.url();
      this.log(`Current URL: ${currentUrl}`);
      
      if (currentUrl.includes('/login')) {
        this.log('Login required, attempting login...');
        await this.login();
      }
      
    } catch (error) {
      this.log(`Navigation failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async login() {
    try {
      this.log('Filling login form...');
      await this.page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await this.page.type('input[type="email"]', 'markustruter01@gmail.com');
      await this.page.type('input[type="password"]', 'password123');
      
      await this.page.click('button[type="submit"]');
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      
      this.log('Login successful', 'success');
      
      // Navigate back to documents
      await this.page.goto('http://localhost:5000/documents', { 
        waitUntil: 'networkidle2' 
      });
    } catch (error) {
      this.log(`Login failed: ${error.message}`, 'error');
    }
  }

  async debugDocumentCards() {
    this.log('Starting document card debugging...');
    
    try {
      // Wait for the page to load
      await this.page.waitForTimeout(3000);
      
      // Check if DocumentCard components are rendered
      const documentCards = await this.page.$$('.bg-card');
      this.log(`Found ${documentCards.length} document cards`);
      
      if (documentCards.length === 0) {
        this.log('No document cards found, checking page content...', 'error');
        const pageContent = await this.page.content();
        this.log(`Page content length: ${pageContent.length}`);
        return;
      }
      
      // Check each document card for Send buttons
      for (let i = 0; i < documentCards.length; i++) {
        const card = documentCards[i];
        
        // Get card title
        const titleElement = await card.$('h3');
        const title = titleElement ? await this.page.evaluate(el => el.textContent, titleElement) : 'Unknown';
        
        // Check for Send button
        const sendButton = await card.$('button:has-text("Send")');
        const sendButtonExists = !!sendButton;
        
        // Check for Mail icon
        const mailIcon = await card.$('svg');
        const mailIconExists = !!mailIcon;
        
        // Count total buttons
        const buttons = await card.$$('button');
        const buttonCount = buttons.length;
        
        this.log(`Card "${title}": Send button: ${sendButtonExists}, Mail icon: ${mailIconExists}, Total buttons: ${buttonCount}`);
        
        if (!sendButtonExists) {
          // Debug button content
          for (let j = 0; j < buttons.length; j++) {
            const buttonText = await this.page.evaluate(el => el.textContent, buttons[j]);
            this.log(`  Button ${j + 1}: "${buttonText}"`);
          }
        }
      }
      
      // Check for any React errors
      const reactErrors = await this.page.evaluate(() => {
        return window.__REACT_ERROR_OVERLAY__ || [];
      });
      
      if (reactErrors.length > 0) {
        this.log(`React errors found: ${reactErrors.length}`, 'error');
      }
      
      // Check console errors
      const consoleErrors = await this.page.evaluate(() => {
        return window.console.errors || [];
      });
      
      this.log(`Console monitoring complete`);
      
    } catch (error) {
      this.log(`Debug failed: ${error.message}`, 'error');
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
      await this.debugDocumentCards();
    } catch (error) {
      this.log(`Debug run failed: ${error.message}`, 'error');
    } finally {
      await this.close();
    }
  }
}

// Run the debugger
const cardDebugger = new DocumentCardDebugger();
cardDebugger.run().then(() => {
  console.log('Debug complete');
}).catch(error => {
  console.error('Debug failed:', error);
});
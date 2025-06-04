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
      await this.page.waitForTimeout(3000);
      
      // Check document cards with multiple selectors
      const cardSelectors = [
        '.bg-card',
        '[class*="card"]',
        '[class*="document"]'
      ];
      
      let documentCards = [];
      for (const selector of cardSelectors) {
        const cards = await this.page.$$(selector);
        if (cards.length > 0) {
          this.log(`Found ${cards.length} elements with selector: ${selector}`);
          documentCards = cards;
          break;
        }
      }
      
      if (documentCards.length === 0) {
        this.log('No document cards found, checking page structure...', 'error');
        
        // Get page HTML to understand structure
        const bodyHTML = await this.page.evaluate(() => document.body.innerHTML);
        this.log(`Page body contains: ${bodyHTML.substring(0, 500)}...`);
        
        // Check if React is loaded
        const reactExists = await this.page.evaluate(() => !!window.React);
        this.log(`React loaded: ${reactExists}`);
        
        return;
      }
      
      // Detailed button analysis
      for (let i = 0; i < Math.min(documentCards.length, 3); i++) {
        const card = documentCards[i];
        
        // Get all text content in card
        const cardText = await this.page.evaluate(el => el.textContent, card);
        this.log(`Card ${i + 1} text: ${cardText.substring(0, 100)}...`);
        
        // Get card HTML
        const cardHTML = await this.page.evaluate(el => el.innerHTML, card);
        this.log(`Card ${i + 1} HTML length: ${cardHTML.length}`);
        
        // Check for buttons
        const buttons = await card.$$('button');
        this.log(`Card ${i + 1} has ${buttons.length} buttons`);
        
        for (let j = 0; j < buttons.length; j++) {
          const button = buttons[j];
          const buttonText = await this.page.evaluate(el => el.textContent.trim(), button);
          const buttonHTML = await this.page.evaluate(el => el.innerHTML, button);
          this.log(`  Button ${j + 1}: Text="${buttonText}" HTML="${buttonHTML}"`);
        }
        
        // Check for Mail icons specifically
        const mailIcons = await card.$$('svg');
        this.log(`Card ${i + 1} has ${mailIcons.length} SVG icons`);
      }
      
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

const cardDebugger = new DocumentCardDebugger();
cardDebugger.run().then(() => {
  console.log('Debug complete');
}).catch(error => {
  console.error('Debug failed:', error);
});
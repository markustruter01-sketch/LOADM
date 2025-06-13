import { chromium } from 'playwright';

async function testQuizEdit() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the application
    await page.goto('http://localhost:5000');
    
    // Wait for login form and login
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'markustruter01@gmail.com');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForTimeout(3000);
    
    // Navigate to instructors portal
    await page.goto('http://localhost:5000/instructors-portal');
    await page.waitForTimeout(2000);
    
    // Click on quizzes link
    await page.click('text=Quizzes');
    await page.waitForTimeout(2000);
    
    // Find and click edit button for a quiz
    const editButton = page.locator('text=Edit').first();
    await editButton.click();
    await page.waitForTimeout(3000);
    
    // Intercept network requests to see what's being sent
    page.on('request', request => {
      if (request.url().includes('/api/quizzes/') && request.method() === 'PUT') {
        console.log('🔧 NETWORK REQUEST: Method:', request.method());
        console.log('🔧 NETWORK REQUEST: URL:', request.url());
        console.log('🔧 NETWORK REQUEST: Headers:', request.headers());
        console.log('🔧 NETWORK REQUEST: Body:', request.postData());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/quizzes/') && response.request().method() === 'PUT') {
        console.log('🔧 NETWORK RESPONSE: Status:', response.status());
        console.log('🔧 NETWORK RESPONSE: URL:', response.url());
      }
    });
    
    // Modify the quiz title
    const titleInput = page.locator('input[name="title"]');
    await titleInput.fill('Updated Quiz Title - Test');
    
    // Wait a moment
    await page.waitForTimeout(1000);
    
    // Click save changes button
    await page.click('text=Save Changes');
    
    // Wait for the request to complete
    await page.waitForTimeout(5000);
    
    console.log('✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testQuizEdit();
const puppeteer = require('puppeteer');

const APP_URL = 'http://localhost:3333';

async function runErrorHandlingTest() {
  console.log('Starting error handling test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to the app
    await page.goto(APP_URL + '/app');
    console.log('Navigated to ThinkFlow app');
    
    // Test invalid URL handling
    await page.goto(APP_URL + '/nonexistent-page');
    console.log('Navigated to non-existent page');
    await page.screenshot({ path: 'error-handling-404.png' });
    
    console.log('Error handling test completed');
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

// Execute the test
runErrorHandlingTest();
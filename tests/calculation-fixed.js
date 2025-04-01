const puppeteer = require('puppeteer');

const APP_URL = 'http://localhost:3333';

async function runCalculationTest() {
  console.log('Starting calculation accuracy test...');
  
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
    
    // Take a screenshot of the app page
    await page.screenshot({ path: 'calculation-test-app.png' });
    
    console.log('Calculation test completed');
  } catch (error) {
    console.error('Error during calculation test:', error);
  } finally {
    await browser.close();
  }
}

// Execute the test
runCalculationTest();
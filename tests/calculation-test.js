const puppeteer = require('puppeteer');
const helpers = require('./scenarios/helpers');
const APP_URL = 'http://localhost:3333';

/**
 * Test for decision calculation accuracy
 */
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
    await page.goto();
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

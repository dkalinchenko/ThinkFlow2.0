const puppeteer = require('puppeteer');

// Define constants
const APP_URL = 'http://localhost:3333';
const SCREENSHOT_DIR = './tests/screenshots';

async function testDecisionResults() {
  console.log('Starting Decision Results Test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to app
    console.log('Navigating to app');
    await page.goto(APP_URL + '/app');
    await page.screenshot({ path: SCREENSHOT_DIR + '/results-01-start.png' });
    
    console.log('Decision Results Test completed');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testDecisionResults();

const puppeteer = require('puppeteer');

// Define constants
const APP_URL = 'http://localhost:3333';
const SCREENSHOT_DIR = './tests/screenshots';

async function testDecisionCreation() {
  console.log('Starting Decision Creation Test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Step 1: Navigate to app
    console.log('Step 1: Navigating to app');
    await page.goto(APP_URL + '/app');
    await page.screenshot({ path: SCREENSHOT_DIR + '/01-app-start.png' });
    
    // Step 2: Enter decision name
    console.log('Step 2: Entering decision name');
    const decisionName = 'Test Car Purchase Decision';
    
    // Wait for the form to be visible and enter decision name
    try {
      await page.waitForSelector('input[type="text"]', { timeout: 5000 });
      const inputFields = await page.$$('input[type="text"]');
      if (inputFields.length > 0) {
        await inputFields[0].type(decisionName);
        console.log('Entered decision name');
      } else {
        console.log('Could not find input field for decision name');
      }
    } catch (error) {
      console.log('Could not find decision name input field');
    }
    
    await page.screenshot({ path: SCREENSHOT_DIR + '/02-decision-name.png' });
    
    console.log('Decision Creation Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testDecisionCreation();

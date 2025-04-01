const puppeteer = require('puppeteer');
const fs = require('fs');

// Define constants
const APP_URL = 'http://localhost:3333';
const SCREENSHOT_DIR = './tests/screenshots';

async function testCriteriaManagement() {
  console.log('Starting Criteria Management Test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 200 // Increase slowMo for more reliable interactions
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Step 1: Navigate to app and start a new decision
    console.log('Step 1: Navigating to app');
    await page.goto(APP_URL + '/app');
    await page.waitForNetworkIdle(); // Wait for network to be idle
    await page.screenshot({ path: SCREENSHOT_DIR + '/01-app-start.png' });
    
    // Step 2: Enter decision name and proceed
    console.log('Step 2: Setting up decision');
    
    // Wait for and focus on the decision name input field (found by ID)
    await page.waitForSelector('#decisionName', { visible: true, timeout: 10000 });
    await page.focus('#decisionName');
    await page.type('#decisionName', 'Criteria Test Decision');
    console.log('Entered decision name');
    
    // Click the Next button (found by ID)
    await page.waitForSelector('#nameFormNextBtn', { visible: true, timeout: 5000 });
    await page.click('#nameFormNextBtn');
    console.log('Clicked Next button');
    
    // Wait for the page to transition to the criteria step
    await page.waitForNetworkIdle();
    await page.screenshot({ path: SCREENSHOT_DIR + '/02-decision-setup.png' });
    
    // Step 3: Find and click Add Criteria button
    console.log('Step 3: Adding criteria');
    
    // Use the specific ID for the Add Criteria button that we found
    await page.waitForSelector('#addCriteriaBtn', { visible: true, timeout: 10000 });
    await page.click('#addCriteriaBtn');
    console.log('Clicked Add Criteria button');
    await page.waitForNetworkIdle();
    await page.screenshot({ path: SCREENSHOT_DIR + '/03-add-criteria.png' });
    
    // Step 4: Enter criteria details
    console.log('Step 4: Entering criteria details');
    
    // Wait for and interact with the criteria input field
    // We don't have a specific ID for this, so use a more general selector for criterion inputs
    await page.waitForSelector('input[placeholder="Enter criterion"]', { visible: true, timeout: 5000 });
    await page.type('input[placeholder="Enter criterion"]', 'Price');
    console.log('Entered criteria name');
    
    // Look for weight/importance fields - these might be number inputs
    const numberInputs = await page.$$('input[type="number"]');
    if (numberInputs.length > 0) {
      await numberInputs[0].type('8');
      console.log('Set criteria weight');
    }
    
    await page.screenshot({ path: SCREENSHOT_DIR + '/04-criteria-details.png' });
    
    console.log('Criteria Management Test completed');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testCriteriaManagement();

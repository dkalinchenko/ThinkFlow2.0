const puppeteer = require('puppeteer');
const utils = require('./test-utils');

// Configuration
const APP_URL = 'http://localhost:3333';
const HEADLESS = false;
const SLOWMO = 50;


// Test data
const testData = {
  decisionName: 'Buying a New Car',
  criteria: [
    { name: 'Price', weight: 9 },
    { name: 'Fuel Efficiency', weight: 7 },
    { name: 'Safety Rating', weight: 10 }
  ],
  alternatives: [
    'Toyota Camry',
    'Honda Accord',
    'Tesla Model 3'
  ],
  ratings: {
    'Toyota Camry': { 'Price': 8, 'Fuel Efficiency': 7, 'Safety Rating': 8 },
    'Honda Accord': { 'Price': 7, 'Fuel Efficiency': 8, 'Safety Rating': 9 },
    'Tesla Model 3': { 'Price': 4, 'Fuel Efficiency': 10, 'Safety Rating': 10 }
  }
};

// Main test function
async function runDecisionWorkflowTest() {
  console.log('
🚀 Starting ThinkFlow Decision Workflow Test
');
  
  const browser = await puppeteer.launch({ 
    headless: HEADLESS,
    slowMo: SLOWMO
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Step 1: Navigate to the app
    console.log('Step 1: Navigating to the app');
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    await utils.takeScreenshot(page, '01-homepage');
    
    console.log('
✅ Test setup completed successfully
');
  } catch (error) {
    console.error('
❌ Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
runDecisionWorkflowTest();

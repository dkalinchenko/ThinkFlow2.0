const puppeteer = require('puppeteer');

const APP_URL = 'http://localhost:3333';

async function runWorkflowTest() {
  console.log('Starting Workflow Test');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Step 1: Navigate to home page
    console.log('Step 1: Navigating to home page');
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'workflow-01-homepage.png' });
    
    console.log('Test completed');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Execute the test
runWorkflowTest();
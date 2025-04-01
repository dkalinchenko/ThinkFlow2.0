const puppeteer = require('puppeteer');
const helpers = require('./scenarios/helpers');

// Configuration
const APP_URL = 'http://localhost:3333';
const APP_PATH = '/app'; // Application main page

async function runWorkflowTest() {
  helpers.log('Starting Complete Workflow Test');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--window-size=1280,800']
  });
    
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Step 1: Navigate to home page
    helpers.log('Step 1: Navigating to home page');
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    await helpers.takeScreenshot(page, '01-homepage');
    
    // Step 2: Click on app entry point
    helpers.log('Step 2: Clicking app entry point');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('a[href*="/app"]')
    ]);
    await helpers.takeScreenshot(page, '02-app-entry');
    
    helpers.log('✅ Navigation to app completed');
        helpers.log('Test completed successfully');
  } catch (error) {
    helpers.log();
    console.error(error);
  } finally {
    await browser.close();
  }
}

// Execute the test
runWorkflowTest();    helpers.log("Test completed successfully");
  } catch (error) {
    helpers.log(`❌ Test failed: ${error.message}`);
    console.error(error);
  } finally {
    await browser.close();
  }
}

// Execute the test
runWorkflowTest();

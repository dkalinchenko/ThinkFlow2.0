const puppeteer = require('puppeteer');

// Define constants
const APP_URL = 'http://localhost:3333';
const SCREENSHOT_DIR = './tests/screenshots';

async function testUIResponsiveness() {
  console.log('Starting UI Responsiveness Test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50
  });
  
  try {
    const page = await browser.newPage();
    
    // Step 1: Test desktop viewport
    console.log('Step 1: Testing desktop viewport');
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(APP_URL);
    await page.waitForNetworkIdle();
    await page.screenshot({ path: SCREENSHOT_DIR + '/01-desktop-viewport.png' });
    
    // Step 2: Test tablet viewport
    console.log('Step 2: Testing tablet viewport');
    await page.setViewport({ width: 768, height: 1024 });
    await page.goto(APP_URL);
    await page.waitForNetworkIdle();
    await page.screenshot({ path: SCREENSHOT_DIR + '/02-tablet-viewport.png' });
    
    // Step 3: Test mobile viewport
    console.log('Step 3: Testing mobile viewport');
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(APP_URL);
    await page.waitForNetworkIdle();
    await page.screenshot({ path: SCREENSHOT_DIR + '/03-mobile-viewport.png' });
    
    // Step 4: Test app page responsiveness
    console.log('Step 4: Testing app page responsiveness');
    await page.goto(APP_URL + '/app');
    await page.waitForNetworkIdle();
    await page.screenshot({ path: SCREENSHOT_DIR + '/04-mobile-app-page.png' });
    
    // Step 5: Test navigation menu on mobile
    console.log('Step 5: Testing mobile navigation');
    
    // Look for hamburger menu button
    const hamburgerButton = await page.$('.navbar-toggler, .hamburger-menu, button[aria-label="Toggle navigation"]');
    if (hamburgerButton) {
      await hamburgerButton.click();
      console.log('Clicked hamburger menu');
      await page.waitForNetworkIdle();
      await page.screenshot({ path: SCREENSHOT_DIR + '/05-mobile-menu-open.png' });
    } else {
      console.log('Could not find hamburger menu button');
    }
    
    console.log('UI Responsiveness Test completed');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testUIResponsiveness();

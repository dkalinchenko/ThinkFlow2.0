const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const APP_URL = 'http://localhost:3333';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');
async function testHomePage() {
  console.log('Testing Homepage');
  const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    console.log('Navigating to app');
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    console.log('Taking screenshot');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-homepage.png'), fullPage: true });
    console.log('Looking for New Decision button');
    const newDecisionButton = await page.;
    const newDecisionButton = await page.;

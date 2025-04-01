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

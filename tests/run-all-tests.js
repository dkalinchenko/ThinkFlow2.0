/**
 * Master test script
 */

console.log('Starting all ThinkFlow tests...');

const { execSync } = require('child_process');

const tests = [
  { name: 'Homepage Test', script: 'test:homepage' },
  { name: 'Workflow Test', script: 'test:workflow' },
  { name: 'Validation Test', script: 'test:validation' },
  { name: 'Calculation Test', script: 'test:calculation' },
  { name: 'Error Handling Test', script: 'test:error-handling' }
];

let passedTests = 0;
let failedTests = 0;

for (const test of tests) {
  console.log('
======================================');
  console.log();
  console.log('======================================
');
  
  try {
    execSync(, { stdio: 'inherit' });
    console.log();
    passedTests++;
  } catch (error) {
    console.error();
    console.error(error.message);
    failedTests++;
  }
}

console.log('
======================================');
console.log('Test Summary');
console.log('======================================');
console.log();
console.log();
console.log();
console.log('======================================
');
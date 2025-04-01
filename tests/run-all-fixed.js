console.log('Running all fixed tests...');

const { execSync } = require('child_process');

const tests = [
  { name: 'Homepage Test', script: 'test:homepage' },
  { name: 'Workflow Test', script: 'test:workflow-fixed' },
  { name: 'Validation Test', script: 'test:validation-fixed' },
  { name: 'Calculation Test', script: 'test:calculation-fixed' },
  { name: 'Error Handling Test', script: 'test:error-handling-fixed' }
];

let passedTests = 0;
let failedTests = 0;

for (const test of tests) {
  console.log();
  console.log();
  console.log();
  
  try {
    execSync(`npm run ${test.script}`, { stdio: 'inherit' });
    console.log();
    passedTests++;
  } catch (error) {
    console.error();
    console.error(error.message);
    failedTests++;
  }
}

console.log();
console.log();
console.log();
console.log();
console.log();
console.log();
console.log();
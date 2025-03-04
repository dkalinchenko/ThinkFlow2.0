/**
 * Decision Matrix Calculation Test
 * This script tests the decision calculation logic directly to diagnose issues
 */

const decisionService = require('./services/decisionService');
const logger = require('./utils/logger');

// Override the logger to ensure all logs are visible regardless of environment
logger.setDebugEnabled(true);

// Test data
const testData = {
  id: `test-${Date.now()}`,
  name: 'Test Decision',
  criteria: ['Price', 'Quality'],
  weights: { 'Price': 7, 'Quality': 9 },
  alternatives: ['Option A', 'Option B'],
  evaluations: {
    'Option A': { 'Price': 8, 'Quality': 6 },
    'Option B': { 'Price': 5, 'Quality': 9 }
  }
};

// Function to run the test
async function runTest() {
  console.log('===== DECISION CALCULATION TEST =====');
  console.log('Testing with data:', JSON.stringify(testData, null, 2));
  
  try {
    // Test Step 1: Create a new decision
    console.log('\n--- STEP 1: Create Decision ---');
    const step1Data = { id: testData.id, name: testData.name };
    let decision = await decisionService.processStep(1, step1Data, {}, null);
    console.log('Step 1 result:', JSON.stringify(decision, null, 2));
    
    // Test Step 2: Add criteria
    console.log('\n--- STEP 2: Add Criteria ---');
    const step2Data = { id: testData.id, criteria: testData.criteria };
    decision = await decisionService.processStep(2, step2Data, { criteria: testData.criteria }, null);
    console.log('Step 2 result:', JSON.stringify(decision, null, 2));
    
    // Test Step 3: Set weights
    console.log('\n--- STEP 3: Set Weights ---');
    const step3Data = { id: testData.id, weights: testData.weights };
    decision = await decisionService.processStep(3, step3Data, { 
      criteria: testData.criteria,
      weights: testData.weights
    }, null);
    console.log('Step 3 result:', JSON.stringify(decision, null, 2));
    
    // Test Step 4: Add alternatives
    console.log('\n--- STEP 4: Add Alternatives ---');
    const step4Data = { id: testData.id, alternatives: testData.alternatives };
    decision = await decisionService.processStep(4, step4Data, {
      criteria: testData.criteria,
      weights: testData.weights,
      alternatives: testData.alternatives
    }, null);
    console.log('Step 4 result:', JSON.stringify(decision, null, 2));
    
    // Test Step 5: Set evaluations and calculate results
    console.log('\n--- STEP 5: Set Evaluations & Calculate Results ---');
    const step5Data = { id: testData.id, evaluations: testData.evaluations };
    
    // Create a detailed state for step 5
    const step5State = {
      name: testData.name,
      criteria: testData.criteria,
      weights: testData.weights,
      alternatives: testData.alternatives,
      evaluations: testData.evaluations
    };
    
    try {
      decision = await decisionService.processStep(5, step5Data, step5State, null);
      console.log('Step 5 result:', JSON.stringify(decision, null, 2));
      console.log('\n✅ TEST PASSED: Decision calculation succeeded!');
      console.log('Results:', JSON.stringify(decision.results, null, 2));
    } catch (step5Error) {
      console.error('\n❌ TEST FAILED: Error in Step 5:', step5Error.message);
      
      // Try to debug the calculation directly
      console.log('\n--- DEBUGGING CALCULATION DIRECTLY ---');
      try {
        // Test the calculation function directly
        const results = decisionService.calculateResults(
          testData.criteria,
          testData.weights,
          testData.evaluations
        );
        console.log('Direct calculation results:', results);
      } catch (calcError) {
        console.error('Calculation error:', calcError.message);
      }
      
      // Check database state
      try {
        const dbDecision = await decisionService.getDecision(testData.id);
        console.log('Database state of decision:', JSON.stringify(dbDecision, null, 2));
      } catch (dbError) {
        console.error('Error getting decision from db:', dbError.message);
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
  
  console.log('\n===== TEST COMPLETE =====');
  
  // We're done, so exit
  process.exit(0);
}

// Run the test
runTest().catch(err => {
  console.error('Unhandled test error:', err);
  process.exit(1);
}); 
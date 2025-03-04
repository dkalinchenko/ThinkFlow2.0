const fetch = require('node-fetch');

async function testDecisionMatrix() {
    console.log('\n=== Starting Decision Matrix Test ===\n');
    
    try {
        // Step 1: Create a new decision
        console.log('Step 1: Creating new decision...');
        const decisionId = Date.now().toString();
        console.log('Generated Decision ID:', decisionId);
        
        const step1Response = await fetch('http://localhost:3333/save-step', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                step: 1,
                data: {
                    id: decisionId,
                    name: 'Test Decision'
                }
            })
        });
        const step1Result = await step1Response.json();
        console.log('Step 1 Result:', JSON.stringify(step1Result, null, 2));
        if (!step1Result.success) throw new Error('Step 1 failed');
        if (step1Result.currentId !== decisionId) throw new Error('Decision ID mismatch in Step 1');

        // Step 2: Add criteria
        console.log('\nStep 2: Adding criteria...');
        const criteria = ['Cost', 'Quality', 'Time'];
        console.log('Adding criteria:', criteria);
        
        const step2Response = await fetch('http://localhost:3333/save-step', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                step: 2,
                data: {
                    id: decisionId,
                    criteria: criteria
                }
            })
        });
        const step2Result = await step2Response.json();
        console.log('Step 2 Result:', JSON.stringify(step2Result, null, 2));
        if (!step2Result.success) throw new Error('Step 2 failed');
        if (step2Result.currentId !== decisionId) throw new Error('Decision ID mismatch in Step 2');

        // Step 3: Set weights
        console.log('\nStep 3: Setting weights...');
        const weights = {
            'Cost': 8,
            'Quality': 9,
            'Time': 7
        };
        console.log('Setting weights:', weights);
        
        const step3Response = await fetch('http://localhost:3333/save-step', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                step: 3,
                data: {
                    id: decisionId,
                    weights: weights
                }
            })
        });
        const step3Result = await step3Response.json();
        console.log('Step 3 Result:', JSON.stringify(step3Result, null, 2));
        if (!step3Result.success) throw new Error('Step 3 failed');
        if (step3Result.currentId !== decisionId) throw new Error('Decision ID mismatch in Step 3');

        // Step 4: Add alternatives
        console.log('\nStep 4: Adding alternatives...');
        const alternatives = ['Option A', 'Option B', 'Option C'];
        console.log('Adding alternatives:', alternatives);
        
        const step4Response = await fetch('http://localhost:3333/save-step', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                step: 4,
                data: {
                    id: decisionId,
                    alternatives: alternatives
                }
            })
        });
        const step4Result = await step4Response.json();
        console.log('Step 4 Result:', JSON.stringify(step4Result, null, 2));
        if (!step4Result.success) throw new Error('Step 4 failed');
        if (step4Result.currentId !== decisionId) throw new Error('Decision ID mismatch in Step 4');

        // Step 5: Evaluate alternatives
        console.log('\nStep 5: Evaluating alternatives...');
        const evaluations = {
            'Option A': {
                'Cost': 8,
                'Quality': 7,
                'Time': 9
            },
            'Option B': {
                'Cost': 6,
                'Quality': 9,
                'Time': 7
            },
            'Option C': {
                'Cost': 9,
                'Quality': 8,
                'Time': 6
            }
        };
        console.log('Setting evaluations:', JSON.stringify(evaluations, null, 2));
        
        const step5Response = await fetch('http://localhost:3333/save-step', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                step: 5,
                data: {
                    id: decisionId,
                    evaluations: evaluations
                }
            })
        });
        const step5Result = await step5Response.json();
        console.log('Step 5 Result:', JSON.stringify(step5Result, null, 2));
        if (!step5Result.success) throw new Error('Step 5 failed');
        if (step5Result.currentId !== decisionId) throw new Error('Decision ID mismatch in Step 5');

        // Verify results
        console.log('\n=== Test Results ===');
        console.log('All steps completed successfully!');
        console.log('Final Results:', JSON.stringify(step5Result.results, null, 2));
        
        // Verify the results make sense
        const results = step5Result.results;
        if (!results || Object.keys(results).length !== 3) {
            throw new Error('Invalid results format');
        }
        
        // Check if scores are within expected range (0-100)
        for (const [option, score] of Object.entries(results)) {
            if (score < 0 || score > 100) {
                throw new Error(`Invalid score for ${option}: ${score}`);
            }
        }

        // Verify all alternatives are present in results
        for (const alternative of alternatives) {
            if (!(alternative in results)) {
                throw new Error(`Missing result for alternative: ${alternative}`);
            }
        }

        console.log('\n=== Test Completed Successfully ===\n');
        return true;
    } catch (error) {
        console.error('\n=== Test Failed ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        return false;
    }
}

// Run the test
testDecisionMatrix().then(success => {
    if (!success) {
        process.exit(1);
    }
}); 
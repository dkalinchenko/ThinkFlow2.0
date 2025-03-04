/**
 * Decision Matrix Application
 * Client-side JavaScript
 */

// State management
const state = {
    currentStep: 1,
    decisionId: null,
    decision: {
        name: '',
        criteria: [],
        weights: {},
        alternatives: [],
        evaluations: {},
        results: {}
    }
};

// DOM Elements
const elements = {
    stepContainers: document.querySelectorAll('.step-container'),
    stepIndicators: document.querySelectorAll('.step-indicator .step'),
    getForm: function(id) {
        return document.getElementById(id);
    },
    getElement: function(id) {
        return document.getElementById(id);
    },
    criteriaList: document.getElementById('criteriaList'),
    alternativesList: document.getElementById('alternativesList'),
    evaluationMatrix: document.getElementById('evaluationMatrix'),
    resultsChart: document.getElementById('resultsChart'),
    resultsSummary: document.getElementById('resultsSummary')
};

// Initialize the application
function initializeApp() {
    // Try to load state from localStorage
    loadStateFromStorage();
    
    // Set up form handlers
    setupFormHandlers();
    
    // Set up step navigation
    setupStepNavigation();
    
    // Set initial decision ID if not already set
    if (!state.decisionId) {
        const nameForm = document.getElementById('nameForm');
        if (nameForm) {
            const hiddenId = nameForm.querySelector('input[name="id"]');
            if (hiddenId) {
                state.decisionId = hiddenId.value;
            }
        }
    }
    
    // Initialize dynamic form elements
    initializeDynamicForms();
    
    // Special handling for step 3 if we're already on it
    if (state.currentStep === 3) {
        prepareWeightFields(state.decision.criteria);
    }
    
    // Special handling for step 5 if we're already on it
    if (state.currentStep === 5) {
        prepareEvaluationMatrix(state.decision.alternatives, state.decision.criteria);
    }
    
    // Add event listeners to remove buttons
    setupRemoveButtons();
}

// Load state from localStorage
function loadStateFromStorage() {
    try {
        const savedState = localStorage.getItem('decisionMatrixState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            if (parsedState && parsedState.decision) {
                // Merge saved state with current state
                state.currentStep = parsedState.currentStep || 1;
                state.decisionId = parsedState.decisionId;
                state.decision = parsedState.decision;
            }
        }
    } catch (error) {
        resetState();
    }
}

// Save state to localStorage
function saveStateToStorage() {
    try {
        localStorage.setItem('decisionMatrixState', JSON.stringify(state));
    } catch (error) {
    }
}

// Reset application state
function resetState() {
    state.currentStep = 1;
    state.decisionId = Date.now().toString();
    state.decision = {
        name: '',
        criteria: [],
        weights: {},
        alternatives: [],
        evaluations: {},
        results: {}
    };
    saveStateToStorage();
}

// Setup form handlers
function setupFormHandlers() {
    // Add event listeners to forms for steps 1-4 (step 5 is handled separately)
    const formIds = ['nameForm', 'criteriaForm', 'weightsForm', 'alternativesForm'];
    
    formIds.forEach((formId, index) => {
        const form = document.getElementById(formId);
        if (form) {
            // Remove any existing event listeners by cloning the form
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            // Add the event listener
            newForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const submitButton = newForm.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.disabled = true;
                }
                try {
                    await handleFormSubmit(newForm, index + 1);
                } catch (error) {
                    showError('Error submitting form: ' + error.message);
                } finally {
                    if (submitButton) {
                        submitButton.disabled = false;
                    }
                }
            });
        }
    });

    // Set up dynamic controls
    setupDynamicControls();
}

// Helper function to replace a button with its clone to remove event listeners
function replaceButtonWithClone(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        const clone = button.cloneNode(true);
        button.parentNode.replaceChild(clone, button);
        return clone;
    }
    return null;
}

// Set up dynamic controls (add criteria, add alternative, new decision)
function setupDynamicControls() {
    // Get buttons
    const addCriteriaBtn = document.getElementById('addCriteriaBtn');
    const addAlternativeBtn = document.getElementById('addAlternativeBtn');
    const newDecisionBtn = document.getElementById('newDecisionBtn');
    
    // Remove any existing event listeners by cloning
    const newAddCriteriaBtn = replaceButtonWithClone('addCriteriaBtn');
    const newAddAlternativeBtn = replaceButtonWithClone('addAlternativeBtn');
    const newNewDecisionBtn = replaceButtonWithClone('newDecisionBtn');
    
    // Add fresh event listeners
    if (newAddCriteriaBtn) {
        newAddCriteriaBtn.addEventListener('click', function(event) {
            addCriteriaField(event);
        });
    }
    
    if (newAddAlternativeBtn) {
        newAddAlternativeBtn.addEventListener('click', function(event) {
            addAlternativeField(event);
        });
    }
    
    if (newNewDecisionBtn) {
        newNewDecisionBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to start a new decision? All current data will be lost.')) {
                window.location.href = '/';
            }
        });
    }
}

// Initialize dynamic form elements
function initializeDynamicForms() {
    // Only add initial fields if the lists are empty
    const criteriaList = document.getElementById('criteriaList');
    if (criteriaList && criteriaList.children.length === 0) {
        addCriteriaField();
    }
    
    const alternativesList = document.getElementById('alternativesList');
    if (alternativesList && alternativesList.children.length === 0) {
        addAlternativeField();
    }
}

// Handle form submissions
async function handleFormSubmit(form, step) {
    try {
        // Ensure we have a decision ID
        if (!state.decisionId) {
            state.decisionId = Date.now().toString();
        }

        const data = {
            id: state.decisionId
        };

        // Process form data based on step
        switch (step) {
            case 1: // Name
                const formData = new FormData(form);
                const name = formData.get('name');
                if (!name || name.trim() === '') {
                    throw new Error('Please enter a decision name');
                }
                state.decision.name = name;
                data.name = name;
                break;

            case 2: // Criteria
                const criteriaFormData = new FormData(form);
                const criteria = Array.from(criteriaFormData.getAll('criteria[]'))
                    .filter(c => c.trim())
                    .map(c => c.trim());
                
                if (criteria.length === 0) {
                    throw new Error('Please add at least one criterion');
                }
                
                state.decision.criteria = [...criteria];
                data.criteria = criteria;
                break;

            case 3: // Weights
                if (!state.decision.criteria || !Array.isArray(state.decision.criteria) || state.decision.criteria.length === 0) {
                    throw new Error('Please define criteria in step 2 first.');
                }

                const weightsFormData = new FormData(form);
                const weights = {};
                
                for (const criterion of state.decision.criteria) {
                    const weightInput = weightsFormData.get(`weights[${criterion}]`);
                    
                    if (!weightInput) {
                        throw new Error(`Please enter a weight for ${criterion}`);
                    }
                    
                    const weight = parseInt(weightInput);
                    if (isNaN(weight) || weight < 1 || weight > 10) {
                        throw new Error(`Please enter a valid weight (1-10) for ${criterion}`);
                    }
                    
                    weights[criterion] = weight;
                }
                
                state.decision.weights = {...weights};
                data.weights = weights;
                break;

            case 4: // Alternatives
                const alternativesFormData = new FormData(form);
                const alternatives = Array.from(alternativesFormData.getAll('alternatives[]'))
                    .filter(a => a.trim())
                    .map(a => a.trim());
                
                if (alternatives.length === 0) {
                    throw new Error('Please add at least one alternative');
                }
                
                state.decision.alternatives = [...alternatives];
                data.alternatives = alternatives;
                break;

            case 5: // Evaluations
                if (!state.decision.evaluations || Object.keys(state.decision.evaluations).length === 0) {
                    throw new Error('No evaluation data found. Please rate all alternatives.');
                }
                
                data.evaluations = state.decision.evaluations;
                break;
        }

        // Add current state to all requests
        data.currentState = state.decision;

        // Save state to localStorage before sending to server
        saveStateToStorage();
        
        // Send data to server
        const response = await fetch('/save-step', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                step,
                data
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${errorText}`);
        }

        const result = await response.json();
        
        if (result.success) {
            // Update state with server response
            updateState(result);
            
            // Save updated state to localStorage
            saveStateToStorage();
            
            if (step === 5) {
                // Make sure we have results
                if (result.results) {
                    // Validate results structure
                    if (typeof result.results !== 'object' || Object.keys(result.results).length === 0) {
                        throw new Error('Invalid results format. Please try again.');
                    }
                    
                    await showResults(result.results, state.decision);
                    updateStep(6);
                } else {
                    throw new Error('No results were returned. Please try again.');
                }
            } else {
                // Handle special case for step 3 (weights)
                if (result.nextStep === 3) {
                    prepareWeightFields(state.decision.criteria);
                }
                
                // Handle special case for step 5 (evaluation matrix)
                if (result.nextStep === 5) {
                    prepareEvaluationMatrix(state.decision.alternatives, state.decision.criteria);
                }
                
                // Update UI to show next step
                updateStep(result.nextStep);
            }
        } else {
            throw new Error(result.error || 'An error occurred');
        }
    } catch (error) {
        throw error;
    }
}

// Update application state with server response
function updateState(result) {
    if (result.currentId) {
        state.decisionId = result.currentId;
    }
    
    // Update decision state with server response
    if (result.criteria) {
        state.decision.criteria = Array.isArray(result.criteria) ? [...result.criteria] : [];
    }
    
    if (result.weights) {
        state.decision.weights = typeof result.weights === 'object' ? {...result.weights} : {};
    }
    
    if (result.alternatives) {
        state.decision.alternatives = Array.isArray(result.alternatives) ? [...result.alternatives] : [];
    }
    
    if (result.results) {
        state.decision.results = {...result.results};
    }

    // Update current step
    if (result.nextStep) {
        state.currentStep = result.nextStep;
    }
}

// Update UI to show the specified step
function updateStep(newStep) {
    // Update step containers
    const allStepContainers = document.querySelectorAll('.step-container');
    
    allStepContainers.forEach(container => {
        container.classList.remove('active');
    });
    
    const nextStepContainer = document.querySelector(`#step${newStep}`);
    if (!nextStepContainer) {
        showError('Could not find the next step container. Please try reloading the page.');
        return;
    }
    
    nextStepContainer.classList.add('active');

    // Update step indicators
    const stepLinks = document.querySelectorAll('.step-link');
    stepLinks.forEach((stepLink, index) => {
        const step = stepLink.querySelector('.step');
        if (index + 1 <= newStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });

    // Update current step in state
    state.currentStep = newStep;
    saveStateToStorage();
    
    // Special handling for step 5
    if (newStep === 5) {
        prepareEvaluationMatrix(state.decision.alternatives, state.decision.criteria);
    }
}

// Prepare weight fields for step 3
function prepareWeightFields(criteria) {
    // Check if criteria exist
    if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
        return false;
    }
    
    // Get the weights form container
    const weightsFormContainer = document.getElementById('step3');
    if (!weightsFormContainer) {
        return false;
    }
    
    try {
        // Clear the container and rebuild it
        weightsFormContainer.innerHTML = '';
        
        // Create heading
        const heading = document.createElement('h2');
        heading.className = 'mb-4';
        heading.textContent = 'Step 3: Set Criteria Weights';
        weightsFormContainer.appendChild(heading);
        
        // Create form
        const form = document.createElement('form');
        form.id = 'weightsForm';
        form.className = 'needs-validation';
        form.noValidate = true;
        weightsFormContainer.appendChild(form);
        
        // Add explanation
        const explanation = document.createElement('p');
        explanation.textContent = 'How important is each criterion? Slide to set importance (1-10)';
        form.appendChild(explanation);
        
        // Create fields container
        const fieldsContainer = document.createElement('div');
        fieldsContainer.className = 'weight-fields-container';
        form.appendChild(fieldsContainer);
        
        // Create weight fields for each criterion
        criteria.forEach(criterion => {
            const field = document.createElement('div');
            field.className = 'mb-4 weight-field';
            
            const labelContainer = document.createElement('div');
            labelContainer.className = 'd-flex justify-content-between align-items-center mb-2';
            
            const label = document.createElement('label');
            label.className = 'form-label mb-0';
            label.setAttribute('for', `weights[${criterion}]`);
            label.textContent = criterion;
            
            const valueDisplay = document.createElement('span');
            valueDisplay.className = 'badge bg-primary';
            valueDisplay.id = `weight-value-${criterion.replace(/\s+/g, '-')}`;
            valueDisplay.textContent = state.decision.weights[criterion] || '5';
            
            labelContainer.appendChild(label);
            labelContainer.appendChild(valueDisplay);
            
            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'range-container';
            
            const input = document.createElement('input');
            input.type = 'range';
            input.className = 'form-range';
            input.id = `weights[${criterion}]`;
            input.name = `weights[${criterion}]`;
            input.min = '1';
            input.max = '10';
            input.step = '1';
            input.required = true;
            input.value = state.decision.weights[criterion] || '5';
            
            // Update value display when slider moves
            input.addEventListener('input', function() {
                valueDisplay.textContent = this.value;
            });
            
            sliderContainer.appendChild(input);
            
            // Create tick marks for the slider (optional)
            const tickMarks = document.createElement('div');
            tickMarks.className = 'd-flex justify-content-between px-2 mt-1';
            for (let i = 1; i <= 10; i++) {
                const tick = document.createElement('small');
                tick.className = 'text-muted';
                tick.textContent = i;
                tickMarks.appendChild(tick);
            }
            
            field.appendChild(labelContainer);
            field.appendChild(sliderContainer);
            field.appendChild(tickMarks);
            fieldsContainer.appendChild(field);
        });
        
        // Add submit button
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'btn btn-primary mt-3';
        submitBtn.textContent = 'Continue to Step 4';
        form.appendChild(submitBtn);
        
        // Attach submit event listener
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            await handleFormSubmit(form, 3);
        });
        
        return true;
    } catch (error) {
        weightsFormContainer.innerHTML = `
            <div class="alert alert-danger">
                <h4>Error Creating Form</h4>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="window.location.reload()">Reload Page</button>
            </div>
        `;
        return false;
    }
}

// Add a new criteria field
function addCriteriaField(event) {
    if (event) {
        event.preventDefault();
    }
    
    const criteriaList = document.getElementById('criteriaList');
    if (!criteriaList) {
        return;
    }
    
    const newItem = document.createElement('div');
    newItem.className = 'form-group mb-2 criteria-item';
    
    newItem.innerHTML = `
        <div class="input-group">
            <input type="text" name="criteria[]" class="form-control" placeholder="Enter criteria" required>
            <button type="button" class="btn btn-danger remove-criteria">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    criteriaList.appendChild(newItem);
    
    // Add event listener to the remove button
    const removeButton = newItem.querySelector('.remove-criteria');
    if (removeButton) {
        removeButton.addEventListener('click', function() {
            criteriaList.removeChild(newItem);
        });
    }
    
    // Focus the new input field
    const input = newItem.querySelector('input');
    if (input) {
        input.focus();
    }
}

// Add a new alternative field
function addAlternativeField(event) {
    if (event) {
        event.preventDefault();
    }
    
    const alternativesList = document.getElementById('alternativesList');
    if (!alternativesList) {
        return;
    }
    
    const newItem = document.createElement('div');
    newItem.className = 'form-group mb-2 alternative-item';
    
    newItem.innerHTML = `
        <div class="input-group">
            <input type="text" name="alternatives[]" class="form-control" placeholder="Enter alternative" required>
            <button type="button" class="btn btn-danger remove-alternative">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    alternativesList.appendChild(newItem);
    
    // Add event listener to the remove button
    const removeButton = newItem.querySelector('.remove-alternative');
    if (removeButton) {
        removeButton.addEventListener('click', function() {
            alternativesList.removeChild(newItem);
        });
    }
    
    // Focus the new input field
    const input = newItem.querySelector('input');
    if (input) {
        input.focus();
    }
}

// Show results
async function showResults(results, currentState) {
    try {
        // Validate results and current state
        if (!results || typeof results !== 'object') {
            showError('Invalid results data structure');
            return;
        }
        
        if (!currentState || !currentState.name || !Array.isArray(currentState.alternatives) || 
            !Array.isArray(currentState.criteria) || !currentState.weights) {
            showError('Invalid decision state data');
            return;
        }
        
        // Format the results for display
        const formattedResults = Object.entries(results).map(([alternative, score]) => {
            return {
                alternative,
                score: typeof score === 'number' ? parseFloat(score.toFixed(2)) : 0
            };
        }).sort((a, b) => b.score - a.score);

        // Display decision name
        const decisionNameDisplay = document.getElementById('decision-name-display');
        if (decisionNameDisplay) {
            decisionNameDisplay.textContent = currentState.name;
        }
        
        // Populate results table
        const resultsTableBody = document.querySelector('#results-table tbody');
        if (!resultsTableBody) {
            showError('UI element not found: results table');
            return;
        }
        
        resultsTableBody.innerHTML = '';
        
        formattedResults.forEach((result, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${result.alternative}</td>
                <td>${result.score}</td>
                <td>${index + 1}</td>
            `;
            resultsTableBody.appendChild(row);
        });
        
        // Populate criteria and weights list
        const criteriaWeightsList = document.getElementById('criteria-weights-list');
        if (criteriaWeightsList) {
            criteriaWeightsList.innerHTML = '';
            
            currentState.criteria.forEach(criterion => {
                const weight = currentState.weights[criterion];
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.innerHTML = `
                    ${criterion}
                    <span class="badge bg-primary rounded-pill">Weight: ${weight}</span>
                `;
                criteriaWeightsList.appendChild(li);
            });
        }
        
        // Populate alternatives list
        const alternativesList = document.getElementById('alternatives-list');
        if (alternativesList) {
            alternativesList.innerHTML = '';
            
            currentState.alternatives.forEach(alternative => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.textContent = alternative;
                alternativesList.appendChild(li);
            });
        } else {
            showError('UI element not found: alternatives list');
        }
    
    // Create chart
        try {
            await createResultsChart(formattedResults);
        } catch (chartError) {
            // Don't fail the whole results display if just the chart fails
        }
        
        // Set up the Save to Account button if present
        const saveToAccountBtn = document.getElementById('save-to-account-btn');
        if (saveToAccountBtn) {
            // Remove any existing event listeners
            const newSaveBtn = saveToAccountBtn.cloneNode(true);
            saveToAccountBtn.parentNode.replaceChild(newSaveBtn, saveToAccountBtn);
            
            newSaveBtn.addEventListener('click', async function() {
                try {
                    if (!state.decisionId) {
                        throw new Error('Decision ID is missing');
                    }

                    const saveData = {
                        decisionId: state.decisionId,
                        name: currentState.name,
                        criteria: currentState.criteria,
                        weights: currentState.weights,
                        alternatives: currentState.alternatives,
                        evaluations: currentState.evaluations,
                        results: results
                    };

                    const response = await fetch('/save-to-account', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(saveData)
                    });

                    const result = await response.json();
                    if (result.success) {
                        showToast('Decision saved successfully!', 'success');
                    } else {
                        throw new Error(result.error || 'Failed to save decision');
                    }
                } catch (error) {
                    showError('Error saving decision: ' + error.message);
                }
            });
        }
        
        // Set up the Start New button
        const startNewBtn = document.getElementById('start-new-btn');
        if (startNewBtn) {
            startNewBtn.addEventListener('click', function() {
                if (confirm('Start a new decision? This will reset your current progress.')) {
                    localStorage.removeItem('decisionMatrixState');
                    window.location.href = '/';
                }
            });
        }
    } catch (error) {
        showError('Error displaying results: ' + error.message);
    }
}

// Create results chart
function createResultsChart(formattedResults) {
    return new Promise((resolve, reject) => {
        // First check if Chart is defined
        if (typeof Chart === 'undefined') {
            reject(new Error('Chart.js is not loaded'));
            return;
        }

        if (!Array.isArray(formattedResults) || formattedResults.length === 0) {
            reject(new Error('Invalid or empty results for chart'));
            return;
        }
        
        const chartCanvas = document.getElementById('resultsChart');
        if (!chartCanvas) {
            reject(new Error('Chart canvas element not found'));
            return;
        }
        
        try {
            // Check if there's an existing chart and destroy it
            if (window.resultsChart instanceof Chart) {
                window.resultsChart.destroy();
            }
            
            // Prepare data for chart
            const labels = formattedResults.map(result => result.alternative);
            const data = formattedResults.map(result => result.score);
            
            // Define colors with opacity
            const backgroundColors = [
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 99, 132, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)',
                'rgba(199, 199, 199, 0.7)'
            ];
            
            // Create new chart
            window.resultsChart = new Chart(chartCanvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Score',
                        data: data,
                        backgroundColor: backgroundColors.slice(0, labels.length),
                        borderColor: backgroundColors.slice(0, labels.length).map(color => color.replace('0.7', '1')),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Score'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Alternative'
                            }
                        }
                    }
                }
            });
            
            resolve(window.resultsChart);
            
        } catch (error) {
            reject(error);
        }
    });
}

// Show error message
function showError(message) {
    if (window.showToast) {
        window.showToast(message, 'error');
    } else {
        alert(message);
    }
}

// Prepare evaluation matrix for step 5
function prepareEvaluationMatrix(alternatives, criteria) {
    // Check if alternatives and criteria exist
    if (!alternatives || !Array.isArray(alternatives) || alternatives.length === 0) {
        showError('No alternatives available. Please complete step 4 first.');
        return false;
    }
    
    if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
        showError('No criteria available. Please complete step 2 first.');
        return false;
    }
    
    // Get the evaluation matrix container
    const evaluationMatrix = document.getElementById('evaluationMatrix');
    if (!evaluationMatrix) {
        showError('Could not find evaluation matrix container. Please try reloading the page.');
        return false;
    }
    
    try {
        // Clear the container
        evaluationMatrix.innerHTML = '';
        
        // Create evaluation fields for each alternative and criterion
        alternatives.forEach(alternative => {
            // Create alternative heading
            const heading = document.createElement('h5');
            heading.className = 'mt-4 mb-3';
            heading.textContent = alternative;
            evaluationMatrix.appendChild(heading);
            
            // Create fields for each criterion
            criteria.forEach(criterion => {
                const field = document.createElement('div');
                field.className = 'mb-4';
                
                const labelContainer = document.createElement('div');
                labelContainer.className = 'd-flex justify-content-between align-items-center mb-2';
                
                const label = document.createElement('label');
                label.className = 'form-label mb-0';
                const inputId = `eval-${alternative}-${criterion}`;
                label.setAttribute('for', inputId);
                label.textContent = criterion;
                
                const valueDisplay = document.createElement('span');
                valueDisplay.className = 'badge bg-primary';
                valueDisplay.id = `${inputId}-value`;
                valueDisplay.textContent = state.decision.evaluations[alternative]?.[criterion] || '5';
                
                labelContainer.appendChild(label);
                labelContainer.appendChild(valueDisplay);
                
                const sliderContainer = document.createElement('div');
                sliderContainer.className = 'range-container';
                
                const input = document.createElement('input');
                input.type = 'range';
                input.className = 'form-range';
                input.id = inputId;
                input.name = `evaluations[${alternative}][${criterion}]`;
                input.min = '1';
                input.max = '10';
                input.step = '1';
                input.required = true;
                input.value = state.decision.evaluations[alternative]?.[criterion] || '5';
                
                // Update value display when slider moves
                input.addEventListener('input', function() {
                    valueDisplay.textContent = this.value;
                });
                
                sliderContainer.appendChild(input);
                
                // Create tick marks for the slider (optional)
                const tickMarks = document.createElement('div');
                tickMarks.className = 'd-flex justify-content-between px-2 mt-1';
                for (let i = 1; i <= 10; i++) {
                    const tick = document.createElement('small');
                    tick.className = 'text-muted';
                    tick.textContent = i;
                    tickMarks.appendChild(tick);
                }
                
                field.appendChild(labelContainer);
                field.appendChild(sliderContainer);
                field.appendChild(tickMarks);
                evaluationMatrix.appendChild(field);
            });
            
            // Add divider after each alternative except the last one
            if (alternative !== alternatives[alternatives.length - 1]) {
                const divider = document.createElement('hr');
                divider.className = 'my-4';
                evaluationMatrix.appendChild(divider);
            }
        });
        
        // Make sure the form has a submit handler
        const evaluationForm = document.getElementById('evaluationForm');
        if (!evaluationForm) {
            showError('Could not find evaluation form. Please try reloading the page.');
            return false;
        }
        
        // Remove any existing event listeners by cloning the form
        const newForm = evaluationForm.cloneNode(true);
        evaluationForm.parentNode.replaceChild(newForm, evaluationForm);
        
        // Add the Calculate Results button if it doesn't exist
        let calculateButton = newForm.querySelector('button[type="submit"]');
        if (!calculateButton) {
            calculateButton = document.createElement('button');
            calculateButton.type = 'submit';
            calculateButton.className = 'btn btn-primary mt-4';
            calculateButton.textContent = 'Calculate Results';
            newForm.appendChild(calculateButton);
        }
        
        // Add click handler to the Calculate Results button
        calculateButton.onclick = async function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            // Collect all evaluation data
            const evaluations = {};
            let isValid = true;
            
            alternatives.forEach(alternative => {
                evaluations[alternative] = {};
                criteria.forEach(criterion => {
                    const inputId = `eval-${alternative}-${criterion}`;
                    const input = document.getElementById(inputId);
                    if (!input) {
                        isValid = false;
                        return;
                    }
                    const value = input.value;
                    if (!value || isNaN(parseInt(value))) {
                        isValid = false;
                        return;
                    }
                    evaluations[alternative][criterion] = parseInt(value);
                });
            });
            
            if (!isValid) {
                showError('Please fill in all evaluation fields with valid values (1-10).');
                return;
            }
            
            // Update state before submitting
            state.decision.evaluations = evaluations;
            saveStateToStorage();
            
            try {
                await handleFormSubmit(newForm, 5);
            } catch (error) {
                showError('Error submitting evaluations: ' + error.message);
            }
        };
        
        return true;
        
    } catch (error) {
        evaluationMatrix.innerHTML = `
            <div class="alert alert-danger">
                <h4>Error Creating Evaluation Matrix</h4>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="window.location.reload()">Reload Page</button>
            </div>
        `;
        return false;
    }
}

// Setup remove buttons
function setupRemoveButtons() {
    // Add event listeners to all remove buttons
    const removeButtons = document.querySelectorAll('.remove-btn');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const item = this.closest('.criteria-item, .alternative-item');
            if (item) {
                item.remove();
            }
        });
    });
}

// Set up step navigation
function setupStepNavigation() {
    const stepLinks = document.querySelectorAll('.step-link');
    stepLinks.forEach(stepLink => {
        stepLink.style.cursor = 'pointer';
        stepLink.addEventListener('click', async function() {
            const targetStep = parseInt(this.dataset.step);
            
            // Don't allow skipping ahead
            if (targetStep > state.currentStep) {
                showError('Please complete the current step first');
                return;
            }
            
            // Validate state before allowing navigation
            if (!canNavigateToStep(targetStep)) {
                return;
            }
            
            // Navigate to the selected step
            await updateStep(targetStep);
        });
    });
}

// Validate if we can navigate to the target step
function canNavigateToStep(targetStep) {
    switch(targetStep) {
        case 1:
            return true;
        case 2:
            if (!state.decision.name) {
                showError('Please enter a decision name first');
                return false;
            }
            return true;
        case 3:
            if (!state.decision.criteria || state.decision.criteria.length === 0) {
                showError('Please define criteria first');
                return false;
            }
            return true;
        case 4:
            if (!state.decision.weights || Object.keys(state.decision.weights).length === 0) {
                showError('Please set weights first');
                return false;
            }
            return true;
        case 5:
            if (!state.decision.alternatives || state.decision.alternatives.length === 0) {
                showError('Please add alternatives first');
                return false;
            }
            return true;
        case 6:
            if (!state.decision.evaluations || Object.keys(state.decision.evaluations).length === 0) {
                showError('Please complete evaluations first');
                return false;
            }
            return true;
        default:
            return false;
    }
}

// Initialize the application when the DOM is fully loaded
if (!window.hasInitialized) {
    window.hasInitialized = true;
    document.addEventListener('DOMContentLoaded', function() {
        // Remove existing event handlers from buttons before initializing
        replaceButtonWithClone('addCriteriaBtn');
        replaceButtonWithClone('addAlternativeBtn');
        replaceButtonWithClone('newDecisionBtn');
        
        // Initialize the application
        initializeApp();
    });
}
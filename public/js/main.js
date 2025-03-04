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

// Logger utility
const logger = {
    log: function(context, message, data) {
        if (window.debugMode) {
            console.log(`[${context}] ${message}`, data || '');
        }
    },
    error: function(context, message, error) {
        console.error(`[ERROR][${context}] ${message}`, error || '');
    },
    state: function() {
        if (window.debugMode) {
        console.log('[STATE]', JSON.stringify(state, null, 2));
        }
    }
};

// Initialize the application
function initializeApp() {
    logger.log('INIT', 'Application initialization started');
    
    // Set debug mode based on URL parameter
    window.debugMode = new URLSearchParams(window.location.search).has('debug');
    
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
                logger.log('INIT', 'Set initial decision ID from form', state.decisionId);
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
    
    // Log initial state
    logger.state();
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
                logger.log('STORAGE', 'Loaded state from localStorage', state);
            }
        } else {
            logger.log('STORAGE', 'No saved state found');
        }
    } catch (error) {
        logger.error('STORAGE', 'Error loading state from localStorage', error);
        resetState();
    }
}

// Save state to localStorage
function saveStateToStorage() {
    try {
        localStorage.setItem('decisionMatrixState', JSON.stringify(state));
        logger.log('STORAGE', 'State saved to localStorage');
    } catch (error) {
        logger.error('STORAGE', 'Error saving state to localStorage', error);
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
    logger.log('STATE', 'State reset to initial values');
}

// Setup form handlers
function setupFormHandlers() {
    logger.log('SETUP', 'Setting up form handlers');
    
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
                await handleFormSubmit(newForm, index + 1);
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
    logger.log('SETUP', 'Setting up dynamic controls');
    
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
            logger.log('CLICK', 'Add criteria button clicked');
            addCriteriaField(event);
        });
    }
    
    if (newAddAlternativeBtn) {
        newAddAlternativeBtn.addEventListener('click', function(event) {
            logger.log('CLICK', 'Add alternative button clicked');
            addAlternativeField(event);
        });
    }
    
    if (newNewDecisionBtn) {
        newNewDecisionBtn.addEventListener('click', function() {
            logger.log('CLICK', 'New decision button clicked');
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
        logger.log('SUBMIT', `Handling form submission for step ${step}`, {
            formId: form.id,
            formAction: form.action,
            formMethod: form.method
        });
        
        // Ensure we have a decision ID
        if (!state.decisionId) {
            state.decisionId = Date.now().toString();
        }

        // Validate form
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        // Get form data
        const formData = new FormData(form);
        let result = {};

        // Process form data based on step
        switch (step) {
            case 1: // Name
                result = {
                    name: formData.get('name')
                };
                break;

            case 2: // Criteria
                const criteriaInputs = form.querySelectorAll('input[name="criteria[]"]');
                const criteria = Array.from(criteriaInputs).map(input => input.value.trim()).filter(Boolean);
                if (criteria.length < 2) {
                    showError('Please add at least two criteria');
                    return;
                }
                result = { criteria };
                break;

            case 3: // Weights
                const weights = {};
                state.decision.criteria.forEach(criterion => {
                    const weight = formData.get(`weights[${criterion}]`);
                    if (weight) {
                        weights[criterion] = parseInt(weight, 10);
                    }
                });
                result = { weights };
                break;

            case 4: // Alternatives
                const alternativeInputs = form.querySelectorAll('input[name="alternatives[]"]');
                const alternatives = Array.from(alternativeInputs).map(input => input.value.trim()).filter(Boolean);
                if (alternatives.length < 2) {
                    showError('Please add at least two alternatives');
                    return;
                }
                result = { alternatives };
                break;
        }

        // Update state with form data
        updateState(result);

        // Save state to storage
        saveStateToStorage();

        // Move to next step
        updateStep(step + 1);

        // Reset form validation state
        form.classList.remove('was-validated');

        logger.log('SUBMIT', 'Form submission successful', { step, result });
        return true;
    } catch (error) {
        logger.error('SUBMIT', 'Error handling form submission', error);
        showError('An error occurred while processing your submission. Please try again.');
        return false;
    }
}

// Update application state with server response
function updateState(result) {
    logger.log('STATE', 'Updating state with result', result);

    // Update state based on result properties
    if (result.name) {
        // Step 1: Update name and initialize decision
        state.decision = {
            name: result.name,
            criteria: [],
            weights: {},
            alternatives: [],
            evaluations: {},
            results: {}
        };
    }

    if (result.criteria) {
        // Step 2: Update criteria and initialize weights
        state.decision.criteria = [...result.criteria];
        state.decision.weights = {};
        result.criteria.forEach(criterion => {
            state.decision.weights[criterion] = 5; // Default weight
        });
    }

    if (result.weights) {
        // Step 3: Update weights
        state.decision.weights = { ...result.weights };
    }

    if (result.alternatives) {
        // Step 4: Update alternatives and initialize evaluations
        state.decision.alternatives = [...result.alternatives];
        state.decision.evaluations = {};
        result.alternatives.forEach(alternative => {
            state.decision.evaluations[alternative] = {};
            state.decision.criteria.forEach(criterion => {
                state.decision.evaluations[alternative][criterion] = 5; // Default score
            });
        });
    }

    if (result.evaluations) {
        // Step 5: Update evaluations
        state.decision.evaluations = { ...result.evaluations };
    }

    if (result.results) {
        // Step 6: Update results
        state.decision.results = { ...result.results };
    }

    logger.log('STATE', 'State updated', state);
    saveStateToStorage();
}

// Update UI to show the specified step
function updateStep(newStep) {
    logger.log('STEP', `Updating step to ${newStep}`);

    // Validate step number
    if (newStep < 1 || newStep > 6) {
        logger.error('STEP', `Invalid step number: ${newStep}`);
        return;
    }

    // Check if we can navigate to this step
    if (!canNavigateToStep(newStep)) {
        logger.error('STEP', `Cannot navigate to step ${newStep} - prerequisites not met`);
        return;
    }

    // Update state
    state.currentStep = newStep;
    saveStateToStorage();

    // Update UI
    elements.stepContainers.forEach((container, index) => {
        if (index + 1 === newStep) {
            container.classList.add('active');
        } else {
            container.classList.remove('active');
        }
    });

    elements.stepIndicators.forEach((indicator, index) => {
        if (index + 1 <= newStep) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });

    // Special handling for different steps
    switch (newStep) {
        case 3:
            prepareWeightFields(state.decision.criteria);
            break;
        case 5:
            prepareEvaluationMatrix(state.decision.alternatives, state.decision.criteria);
            break;
        case 6:
            if (state.decision.results) {
                showResults(state.decision.results, state.decision);
            }
            break;
    }

    logger.log('STEP', `Step updated to ${newStep}`);
}

// Prepare weight fields for step 3
function prepareWeightFields(criteria) {
    logger.log('WEIGHTS', 'Preparing weight fields for criteria', criteria);
    
    // Check if criteria exist
    if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
        logger.error('WEIGHTS', 'No criteria available to create weight fields');
        return false;
    }
    
    // Get the weights form container
    const weightsFormContainer = document.getElementById('step3');
    if (!weightsFormContainer) {
        logger.error('WEIGHTS', 'Could not find step3 container');
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
            
        logger.log('WEIGHTS', 'Successfully created weight fields with sliders');
            return true;
    } catch (error) {
        logger.error('WEIGHTS', 'Error creating weight fields', error);
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
    
    logger.log('ACTION', 'Adding a single criteria field');
    
    const criteriaList = document.getElementById('criteriaList');
    if (!criteriaList) {
        logger.error('Could not find criteriaList element');
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
    
    logger.log('ACTION', 'Adding a single alternative field');
    
    const alternativesList = document.getElementById('alternativesList');
    if (!alternativesList) {
        logger.error('Could not find alternativesList element');
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
        logger.log('RESULTS_DISPLAY', 'Processing results for display', results);
        
        // Validate results and current state
        if (!results || typeof results !== 'object') {
            logger.error('RESULTS_DISPLAY', 'Invalid results object', results);
            showError('Invalid results data structure');
            return;
        }
        
        if (!currentState || !currentState.name || !Array.isArray(currentState.alternatives) || 
            !Array.isArray(currentState.criteria) || !currentState.weights) {
            logger.error('RESULTS_DISPLAY', 'Invalid current state', currentState);
            showError('Invalid decision state data');
            return;
        }
        
        // Format the results for display
        const formattedResults = Object.entries(results).map(([alternative, score]) => {
            return {
                alternative,
                score: typeof score === 'number' ? parseFloat((score * 100).toFixed(1)) : 0
            };
        }).sort((a, b) => b.score - a.score);
        
        logger.log('RESULTS_DISPLAY', 'Formatted results', formattedResults);

        // Display decision name
        const decisionNameDisplay = document.getElementById('decision-name-display');
        if (decisionNameDisplay) {
            decisionNameDisplay.textContent = currentState.name;
        }
        
        // Populate results table
        const resultsTableBody = document.querySelector('#results-table tbody');
        if (!resultsTableBody) {
            logger.error('RESULTS_DISPLAY', 'Results table body element not found');
            showError('UI element not found: results table');
            return;
        }
        
        resultsTableBody.innerHTML = '';
        
        formattedResults.forEach((result, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${result.alternative}</td>
                <td>${result.score}%</td>
                <td>#${index + 1}</td>
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
            logger.warn('RESULTS_DISPLAY', 'Alternatives list element not found');
        }
    
    // Create chart
        try {
            await createResultsChart(formattedResults);
        } catch (chartError) {
            logger.error('RESULTS_DISPLAY', 'Error creating chart', chartError);
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

                    logger.log('SAVE', 'Saving decision to account', {
                        decisionId: state.decisionId,
                        name: currentState.name,
                        state: state
                    });

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
                    logger.error('SAVE', 'Error saving decision', error);
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
        logger.error('RESULTS_DISPLAY', 'Error displaying results', error);
        showError('Error displaying results: ' + error.message);
    }
}

// Create results chart
function createResultsChart(formattedResults) {
    logger.log('CHART', 'Starting chart creation', formattedResults);
    
    return new Promise((resolve, reject) => {
        // First check if Chart is defined
        if (typeof Chart === 'undefined') {
            const error = new Error('Chart.js is not loaded');
            logger.error('CHART', 'Chart.js not found', error);
            reject(error);
            return;
        }

        if (!Array.isArray(formattedResults) || formattedResults.length === 0) {
            const error = new Error('Invalid or empty results for chart');
            logger.error('CHART', 'Invalid data for chart creation', error);
            reject(error);
            return;
        }
        
        const chartCanvas = document.getElementById('resultsChart');
        if (!chartCanvas) {
            const error = new Error('Chart canvas element not found');
            logger.error('CHART', 'Canvas element not found', error);
            reject(error);
            return;
        }
        
        try {
            // Check if there's an existing chart and destroy it
            if (window.resultsChart instanceof Chart) {
                logger.log('CHART', 'Destroying existing chart');
                window.resultsChart.destroy();
            }
            
            // Prepare data for chart
            const labels = formattedResults.map(result => result.alternative);
            const data = formattedResults.map(result => result.score);
            
            logger.log('CHART', 'Chart data prepared', { labels, data });
            
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
                        label: 'Score (%)',
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
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Score: ${context.parsed.y}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Score (%)'
                            },
                            max: 100
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
            
            logger.log('CHART', 'Chart created successfully');
            resolve(window.resultsChart);
            
        } catch (error) {
            logger.error('CHART', 'Error creating chart', error);
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
    logger.log('EVALUATION', 'Preparing evaluation matrix', { alternatives, criteria });
    
    // Check if alternatives and criteria exist
    if (!alternatives || !Array.isArray(alternatives) || alternatives.length === 0) {
        logger.error('EVALUATION', 'No alternatives available to create evaluation matrix');
        showError('No alternatives available. Please complete step 4 first.');
        return false;
    }
    
    if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
        logger.error('EVALUATION', 'No criteria available to create evaluation matrix');
        showError('No criteria available. Please complete step 2 first.');
        return false;
    }
    
    // Get the evaluation matrix container
    const evaluationMatrix = document.getElementById('evaluationMatrix');
    if (!evaluationMatrix) {
        logger.error('EVALUATION', 'Could not find evaluationMatrix container');
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
                    logger.log('EVALUATION', `Slider value changed: ${alternative}/${criterion} = ${this.value}`);
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
                
                logger.log('EVALUATION', `Created evaluation field for ${alternative}/${criterion}`);
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
            logger.error('EVALUATION', 'Could not find evaluation form element');
            showError('Could not find evaluation form. Please try reloading the page.');
            return false;
        }
        
        logger.log('EVALUATION', 'Found evaluation form, setting up submit handler');
        
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
            logger.log('EVALUATION', 'Added Calculate Results button to form');
        }
        
        // Add click handler to the Calculate Results button
        calculateButton.onclick = async function(event) {
            event.preventDefault();
            event.stopPropagation();
            logger.log('EVALUATION', 'Calculate Results button clicked');
            
            // Collect all evaluation data
            const evaluations = {};
            let isValid = true;
            
            alternatives.forEach(alternative => {
                evaluations[alternative] = {};
                criteria.forEach(criterion => {
                    const inputId = `eval-${alternative}-${criterion}`;
                    const input = document.getElementById(inputId);
                    if (!input) {
                        logger.error('EVALUATION', `Missing input field: ${inputId}`);
                        isValid = false;
                        return;
                    }
                    const value = input.value;
                    if (!value || isNaN(parseInt(value))) {
                        logger.error('EVALUATION', `Invalid value for ${alternative}/${criterion}: ${value}`);
                        isValid = false;
                        return;
                    }
                    evaluations[alternative][criterion] = parseInt(value);
                    logger.log('EVALUATION', `Collected value for ${alternative}/${criterion}: ${value}`);
                });
            });
            
            if (!isValid) {
                showError('Please fill in all evaluation fields with valid values (1-10).');
                return;
            }
            
            logger.log('EVALUATION', 'All evaluations collected:', evaluations);
            
            // Update state before submitting
            state.decision.evaluations = evaluations;
            saveStateToStorage();
            
            logger.log('EVALUATION', 'Updated state with evaluations, submitting form');
            
            try {
                await handleFormSubmit(newForm, 5);
                logger.log('EVALUATION', 'Form submission completed');
            } catch (error) {
                logger.error('EVALUATION', 'Error submitting form:', error);
                showError('Error submitting evaluations: ' + error.message);
            }
        };
        
        logger.log('EVALUATION', 'Submit handler attached successfully');
        return true;
        
    } catch (error) {
        logger.error('EVALUATION', 'Error creating evaluation matrix', error);
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
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
    logger.log('INIT', 'Initializing application');
    
    // Define key elements for global access
    elements = {
        stepContainers: document.querySelectorAll('.step-container'),
        stepIndicators: document.querySelectorAll('.step-indicator .step'),
        forms: document.querySelectorAll('form')
    };
    
    // Load state from storage
    loadStateFromStorage();
    
    // Setup event handlers
    setupFormHandlers();
    setupDynamicControls();
    setupRemoveButtons();
    setupStepNavigation();
    setupSaveToAccount();
    setupDescriptionToggles();
    
    // If we have a saved decision, go to the saved step
    if (state && state.currentStep) {
        logger.log('INIT', `Restoring to step ${state.currentStep}`);
        updateStep(state.currentStep);
    } else {
        // Otherwise start at step 1
        updateStep(1);
    }
    
    logger.log('INIT', 'Application initialization complete');
}

// Load state from localStorage
function loadStateFromStorage() {
    try {
        logger.log('STORAGE', 'Loading state from localStorage');
        
        // Try to get state from localStorage
        const savedState = localStorage.getItem('decisionState');
        
        if (savedState) {
            // Parse the state
            const parsedState = JSON.parse(savedState);
            
            // Validate state structure
            if (parsedState && parsedState.decision) {
                state = parsedState;
                logger.log('STORAGE', 'State loaded successfully from localStorage');
            } else {
                logger.warn('STORAGE', 'Invalid state structure in localStorage, initializing fresh state');
                state = resetState();
            }
        } else {
            logger.log('STORAGE', 'No saved state found in localStorage, initializing fresh state');
            state = resetState();
        }
    } catch (error) {
        logger.error('STORAGE', 'Error loading state from localStorage:', error);
        state = resetState();
    }
    
    // Ensure we always have a valid state
    if (!state || !state.decision) {
        logger.warn('STORAGE', 'Invalid state after loading, resetting to default');
        state = resetState();
    }
    
    logger.log('STORAGE', 'Current state:', state);
}

// Save state to localStorage
function saveStateToStorage() {
    try {
        logger.log('STORAGE', 'Saving state to localStorage');
        
        // Save state to localStorage
        localStorage.setItem('decisionState', JSON.stringify(state));
        
        logger.log('STORAGE', 'State saved successfully to localStorage');
    } catch (error) {
        logger.error('STORAGE', 'Error saving state to localStorage:', error);
    }
}

// Reset application state
function resetState() {
    logger.log('STATE', 'Resetting state');
    
    // Clear state
    state = {
        currentStep: 1,
        decision: {
            name: '',
            criteria: [],
            weights: {},
            alternatives: [],
            evaluations: {},
            results: {}
        }
    };
    
    // Save to storage
    saveStateToStorage();
    
    logger.log('STATE', 'State reset complete');
    
    return state;
}

// Setup form handlers
function setupFormHandlers() {
    logger.log('SETUP', 'Setting up form handlers');
    
    // Direct click handler for the name form "Next" button
    const nameNextBtn = document.getElementById('nameFormNextBtn');
    if (nameNextBtn) {
        nameNextBtn.addEventListener('click', function() {
            logger.log('CLICK', 'Name form Next button clicked');
            
            // Get name input value
            const nameInput = document.getElementById('decisionName');
            if (!nameInput || !nameInput.value.trim()) {
                // Show validation error
                nameInput.classList.add('is-invalid');
                return;
            }
            
            // Remove validation error if present
            nameInput.classList.remove('is-invalid');
            
            // Update state with name
            const nameValue = nameInput.value.trim();
            logger.log('FORM', `Processing name form with value: ${nameValue}`);
            
            // Reset state for a new decision but keep the name
            resetState();
            
            // Update state with new name
            updateState({
                name: nameValue,
                step: 2
            });
            
            // Go to next step
            updateStep(2);
            
            logger.log('FORM', 'Name form processed successfully');
        });
    } else {
        logger.error('SETUP', 'Name form Next button not found');
    }
    
    // Handle remaining forms
    const formIds = ['criteriaForm', 'weightsForm', 'alternativesForm'];
    
    formIds.forEach((formId, index) => {
        const form = document.getElementById(formId);
        if (form) {
            // Remove any existing event listeners by cloning the form
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            // Add the event listener
            newForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                await handleFormSubmit(newForm, index + 2); // +2 because we start at step 2
            });
        } else {
            logger.error('SETUP', `Form with id ${formId} not found`);
        }
    });
    
    logger.log('SETUP', 'Form handlers setup complete');
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
    
    // Setup add criteria button
    if (addCriteriaBtn) {
        addCriteriaBtn.addEventListener('click', function(event) {
            logger.log('CLICK', 'Add criteria button clicked');
            addCriteriaField(event);
        });
    }
    
    // Setup add alternative button
    if (addAlternativeBtn) {
        addAlternativeBtn.addEventListener('click', function(event) {
            logger.log('CLICK', 'Add alternative button clicked');
            addAlternativeField(event);
        });
    }
    
    // Setup new decision button
    if (newDecisionBtn) {
        newDecisionBtn.addEventListener('click', function() {
            logger.log('CLICK', 'New decision button clicked');
            if (confirm('Are you sure you want to start a new decision? All current data will be lost.')) {
                resetState();
                updateStep(1);
                logger.log('DECISION', 'Started new decision');
            }
        });
    }
    
    // Set up description toggles for existing items
    setupDescriptionToggles();
}

// Set up toggles for description fields
function setupDescriptionToggles() {
    logger.log('SETUP', 'Setting up description toggles');
    
    const toggleButtons = document.querySelectorAll('.toggle-description');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const collapse = this.parentElement.previousElementSibling;
            if (collapse) {
                const isHidden = !collapse.classList.contains('show');
                collapse.classList.toggle('show');
                this.textContent = isHidden ? 'Hide description' : 'Add description';
            }
        });
    });
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
    logger.log('FORM', `Handling form submission for step ${step}`);
    
    try {
        // Validate form
        if (!form.checkValidity()) {
            logger.log('FORM', 'Form validation failed');
            form.classList.add('was-validated');
            return false;
        }
        
        const formData = new FormData(form);
        
        // Update state based on form type
        switch (form.id) {
            case 'nameForm':
                const name = formData.get('name');
                if (!name || name.trim() === '') {
                    logger.error('FORM', 'Name is required');
                    form.classList.add('was-validated');
                    return false;
                }
                
                updateState({
                    name: name,
                    step: 2
                });
                break;
                
            case 'criteriaForm':
                const criteria = formData.getAll('criteria[]');
                const criteriaDesc = formData.getAll('criteriaDesc[]');
                
                if (criteria.length < 2) {
                    logger.error('FORM', 'At least 2 criteria are required');
                    showError('Please add at least 2 criteria for your decision.');
                    return false;
                }
                
                // Create descriptions object
                const descriptions = {};
                criteria.forEach((criterion, index) => {
                    if (criteriaDesc[index]) {
                        descriptions[criterion] = criteriaDesc[index];
                    }
                });
                
                updateState({
                    criteria: criteria,
                    criteriaDescriptions: descriptions,
                    step: 3
                });
                
                // Prepare weight fields for step 3
                prepareWeightFields(criteria);
                break;
                
            case 'weightsForm':
                const weights = {};
                state.decision.criteria.forEach(criterion => {
                    const weight = formData.get(`weights[${criterion}]`);
                    weights[criterion] = parseFloat(weight) || 5;
                });
                
                // Normalize weights
                const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
                state.decision.criteria.forEach(criterion => {
                    weights[criterion] = weights[criterion] / totalWeight;
                });
                
                updateState({
                    weights: weights,
                    step: 4
                });
                break;
                
            case 'alternativesForm':
                const alternatives = formData.getAll('alternatives[]');
                const alternativesDesc = formData.getAll('alternativesDesc[]');
                
                if (alternatives.length < 2) {
                    logger.error('FORM', 'At least 2 alternatives are required');
                    showError('Please add at least 2 alternatives for your decision.');
                    return false;
                }
                
                // Create descriptions object
                const altDescriptions = {};
                alternatives.forEach((alternative, index) => {
                    if (alternativesDesc[index]) {
                        altDescriptions[alternative] = alternativesDesc[index];
                    }
                });
                
                updateState({
                    alternatives: alternatives,
                    alternativeDescriptions: altDescriptions,
                    step: 5
                });
                
                // Prepare evaluation matrix for step 5
                prepareEvaluationMatrix(alternatives, state.decision.criteria);
                break;
                
            case 'evaluationForm':
                // This is now handled by calculateButtonHandler
                break;
                
            default:
                logger.error('FORM', `Unknown form id: ${form.id}`);
                return false;
        }
        
        // Save state to storage
        saveStateToStorage();
        
        // Update UI to show next step
        updateStep(step + 1);
        
        // Reset form validation state
        form.classList.remove('was-validated');
        
        logger.log('FORM', `Form submission for step ${step} completed successfully`);
        return true;
    } catch (error) {
        logger.error('FORM', `Error handling form submission for step ${step}:`, error);
        showError('Error saving your data. Please try again.');
        return false;
    }
}

// Update application state with server response
function updateState(result) {
    logger.log('STATE', 'Updating state with result', result);

    // Initialize state if needed
    if (!state.decision) {
        state.decision = {
            name: '',
            criteria: [],
            weights: {},
            alternatives: [],
            evaluations: {},
            results: {}
        };
    }

    // Update state based on result properties
    if (result.name) {
        // Step 1: Update name
        state.decision.name = result.name;
    }

    if (result.criteria) {
        // Step 2: Update criteria and initialize weights
        state.decision.criteria = [...result.criteria];
        
        // Initialize weights if needed
        if (!state.decision.weights) {
            state.decision.weights = {};
        }
        
        // Set default weights for new criteria
        result.criteria.forEach(criterion => {
            if (!state.decision.weights[criterion]) {
                state.decision.weights[criterion] = 1 / result.criteria.length;
            }
        });
        
        // Store criteria descriptions if provided
        if (result.criteriaDescriptions) {
            state.decision.criteriaDescriptions = { ...result.criteriaDescriptions };
        }
    }

    if (result.weights) {
        // Step 3: Update weights
        state.decision.weights = { ...result.weights };
    }

    if (result.alternatives) {
        // Step 4: Update alternatives and initialize evaluations
        state.decision.alternatives = [...result.alternatives];
        
        // Initialize evaluations if needed
        if (!state.decision.evaluations) {
            state.decision.evaluations = {};
        }
        
        // Initialize evaluations for new alternatives
        result.alternatives.forEach(alternative => {
            if (!state.decision.evaluations[alternative]) {
                state.decision.evaluations[alternative] = {};
                
                // Initialize with default values for each criterion
                if (state.decision.criteria) {
                    state.decision.criteria.forEach(criterion => {
                        state.decision.evaluations[alternative][criterion] = 5; // Default value
                    });
                }
            }
        });
        
        // Store alternative descriptions if provided
        if (result.alternativeDescriptions) {
            state.decision.alternativeDescriptions = { ...result.alternativeDescriptions };
        }
    }

    if (result.evaluations) {
        // Step 5: Update evaluations
        state.decision.evaluations = { ...result.evaluations };
    }

    if (result.results) {
        // Step 6: Update results
        state.decision.results = { ...result.results };
    }

    // Update current step if provided
    if (result.step) {
        state.currentStep = result.step;
    }

    // Save state to storage
    saveStateToStorage();
    
    logger.log('STATE', 'State updated successfully', state);
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
    logger.log('CRITERIA', 'Adding new criteria field');
    event.preventDefault();
    
    const criteriaList = document.getElementById('criteriaList');
    if (!criteriaList) {
        logger.error('CRITERIA', 'Criteria list container not found');
        return;
    }
    
    const newItem = document.createElement('div');
    newItem.className = 'criteria-item';
    newItem.innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control" name="criteria[]" placeholder="Enter criterion" required>
            <button type="button" class="btn btn-outline-danger remove-btn">Remove</button>
        </div>
        <div class="collapse mt-2 mb-3">
            <textarea class="form-control" name="criteriaDesc[]" placeholder="Optional description for this criterion" rows="2"></textarea>
        </div>
        <div class="text-end">
            <button type="button" class="btn btn-sm btn-link toggle-description">Add description</button>
        </div>
    `;
    
    criteriaList.appendChild(newItem);
    
    // Re-attach remove button handler
    setupRemoveButtons();
    
    // Set up toggle for description field
    const toggleButton = newItem.querySelector('.toggle-description');
    if (toggleButton) {
        toggleButton.addEventListener('click', function() {
            const collapse = this.parentElement.previousElementSibling;
            if (collapse) {
                const isHidden = !collapse.classList.contains('show');
                collapse.classList.toggle('show');
                this.textContent = isHidden ? 'Hide description' : 'Add description';
            }
        });
    }
    
    logger.log('CRITERIA', 'New criteria field added');
}

// Add a new alternative field
function addAlternativeField(event) {
    logger.log('ALTERNATIVES', 'Adding new alternative field');
    event.preventDefault();
    
    const alternativesList = document.getElementById('alternativesList');
    if (!alternativesList) {
        logger.error('ALTERNATIVES', 'Alternatives list container not found');
        return;
    }
    
    const newItem = document.createElement('div');
    newItem.className = 'alternative-item';
    newItem.innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control" name="alternatives[]" placeholder="Enter alternative" required>
            <button type="button" class="btn btn-outline-danger remove-btn">Remove</button>
        </div>
        <div class="collapse mt-2 mb-3">
            <textarea class="form-control" name="alternativesDesc[]" placeholder="Optional description for this alternative" rows="2"></textarea>
        </div>
        <div class="text-end">
            <button type="button" class="btn btn-sm btn-link toggle-description">Add description</button>
        </div>
    `;
    
    alternativesList.appendChild(newItem);
    
    // Re-attach remove button handler
    setupRemoveButtons();
    
    // Set up toggle for description field
    const toggleButton = newItem.querySelector('.toggle-description');
    if (toggleButton) {
        toggleButton.addEventListener('click', function() {
            const collapse = this.parentElement.previousElementSibling;
            if (collapse) {
                const isHidden = !collapse.classList.contains('show');
                collapse.classList.toggle('show');
                this.textContent = isHidden ? 'Hide description' : 'Add description';
            }
        });
    }
    
    logger.log('ALTERNATIVES', 'New alternative field added');
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
    
    // Initialize the evaluations object in state if it doesn't exist
    if (!state.decision.evaluations) {
        state.decision.evaluations = {};
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
            
            // Initialize alternative in state if needed
            if (!state.decision.evaluations[alternative]) {
                state.decision.evaluations[alternative] = {};
            }
            
            // Create fields for each criterion
            criteria.forEach(criterion => {
                const field = document.createElement('div');
                field.className = 'mb-4 evaluation-row';
                field.setAttribute('data-alternative', alternative);
                field.setAttribute('data-criterion', criterion);
                
                const labelContainer = document.createElement('div');
                labelContainer.className = 'd-flex justify-content-between align-items-center mb-2';
                
                const label = document.createElement('label');
                label.className = 'form-label mb-0';
                const inputId = `eval-${alternative}-${criterion}`;
                label.setAttribute('for', inputId);
                label.textContent = criterion;
                
                // Get initial value from state or default to 5
                const initialValue = state.decision.evaluations[alternative][criterion] || 5;
                
                const valueDisplay = document.createElement('span');
                valueDisplay.className = 'badge bg-primary';
                valueDisplay.id = `${inputId}-value`;
                valueDisplay.textContent = initialValue;
                
                labelContainer.appendChild(label);
                labelContainer.appendChild(valueDisplay);
                
                const sliderContainer = document.createElement('div');
                sliderContainer.className = 'range-container w-100';
                
                const input = document.createElement('input');
                input.type = 'range';
                input.className = 'form-range evaluation-input';
                input.id = inputId;
                input.name = `evaluations[${alternative}][${criterion}]`;
                input.min = '1';
                input.max = '10';
                input.step = '1';
                input.required = true;
                input.value = initialValue;
                input.setAttribute('data-alternative', alternative);
                input.setAttribute('data-criterion', criterion);
                
                // Store the initial value in state
                state.decision.evaluations[alternative][criterion] = parseInt(initialValue);
                
                // Update value display when slider moves
                const updateValue = function() {
                    valueDisplay.textContent = this.value;
                    // Also update state directly
                    state.decision.evaluations[alternative][criterion] = parseInt(this.value);
                    logger.log('EVALUATION', `Slider value changed: ${alternative}/${criterion} = ${this.value}`);
                };
                
                // Attach both input and change events for good measure
                input.addEventListener('input', updateValue);
                input.addEventListener('change', updateValue);
                
                sliderContainer.appendChild(input);
                
                field.appendChild(labelContainer);
                field.appendChild(sliderContainer);
                evaluationMatrix.appendChild(field);
            });
        });
        
        // Add the submit button if it doesn't exist or replace it if it does
        let calculateButton = document.querySelector('#evaluationForm button[type="submit"]');
        if (!calculateButton) {
            calculateButton = document.createElement('button');
            calculateButton.type = 'submit';
            calculateButton.className = 'btn btn-primary';
            calculateButton.textContent = 'Calculate Results';
            document.getElementById('evaluationForm').appendChild(calculateButton);
        } else {
            // Clone and replace to remove any existing event handlers
            const newButton = calculateButton.cloneNode(true);
            newButton.textContent = 'Calculate Results';
            calculateButton.parentNode.replaceChild(newButton, calculateButton);
            calculateButton = newButton;
        }
        
        // Add the event handler to the button
        calculateButton.addEventListener('click', calculateButtonHandler);
        
        logger.log('EVALUATION', 'Successfully created evaluation matrix');
        return true;
    } catch (error) {
        logger.error('EVALUATION', 'Error creating evaluation matrix:', error);
        showError('Error creating evaluation matrix: ' + error.message);
        return false;
    }
}

// Handler for the Calculate Results button
function calculateButtonHandler(event) {
    logger.log('EVALUATION', 'Calculate button clicked');
    event.preventDefault();
    
    try {
        // Collect evaluation data
        const evaluations = state.decision.evaluations;
        
        // Validate evaluations
        if (!evaluations || Object.keys(evaluations).length === 0) {
            logger.error('EVALUATION', 'No evaluation data collected');
            showError('Please evaluate all alternatives first.');
            return;
        }
        
        logger.log('EVALUATION', 'Collected evaluations:', evaluations);
        
        // Update state and calculate results
        updateState({
            step: 6,
            evaluations: evaluations
        });
        
        // Calculate and display results
        calculateResults();
    } catch (error) {
        logger.error('EVALUATION', 'Error handling evaluation calculation:', error);
        showError('An error occurred while calculating results. Please try again.');
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

// Setup save to account functionality
function setupSaveToAccount() {
    const saveBtn = document.getElementById('save-to-account-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/decisions/save-to-account', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        decisionId: state.decisionId,
                        name: state.decision.name,
                        criteria: state.decision.criteria,
                        weights: state.decision.weights,
                        alternatives: state.decision.alternatives,
                        evaluations: state.decision.evaluations,
                        results: state.decision.results
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    // Show success message
                    showMessage('Decision saved successfully!', 'success');
                } else {
                    // Show error message
                    showMessage(data.error || 'Error saving decision', 'error');
                }
            } catch (error) {
                logger.error('SAVE', 'Error saving decision to account', error);
                showMessage('Error saving decision to your account', 'error');
            }
        });
    }
}

// Show message helper
function showMessage(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Find a good place to show the alert
    const container = document.querySelector('.step-container.active .card-body');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

// Display results in table and chart
function displayResults(results) {
    logger.log('RESULTS', 'Displaying results', results);
    
    try {
        // Validate results object
        if (!results || Object.keys(results).length === 0) {
            logger.error('RESULTS', 'Invalid results object:', results);
            showError('No valid results to display.');
            return;
        }
        
        // First, navigate to the results step
        updateStep(6);
        
        // Get the results container
        const resultsStep = document.getElementById('step6');
        if (!resultsStep) {
            logger.error('RESULTS', 'Could not find results step container');
            showError('Could not find results container. Please try reloading the page.');
            return;
        }
        
        // Update decision name in results
        const decisionNameDisplay = document.getElementById('resultDecisionName');
        if (decisionNameDisplay) {
            decisionNameDisplay.textContent = state.decision.name || 'Your Decision';
        }
        
        // Sort alternatives by score for display
        const sortedAlternatives = Object.keys(results).sort((a, b) => results[b].score - results[a].score);
        logger.log('RESULTS', 'Sorted alternatives by score:', sortedAlternatives);
        
        // Update results table
        const resultsTable = document.getElementById('resultsTable');
        if (!resultsTable) {
            logger.error('RESULTS', 'Could not find results table element');
            showError('Results table element not found. Please try reloading the page.');
            return;
        }
        
        let resultsTableBody = resultsTable.querySelector('tbody');
        if (!resultsTableBody) {
            logger.error('RESULTS', 'Could not find results table body');
            const tbody = document.createElement('tbody');
            resultsTable.appendChild(tbody);
            resultsTableBody = tbody;
        } else {
            resultsTableBody.innerHTML = '';
        }
        
        // Populate results table
        sortedAlternatives.forEach((alternative) => {
            const row = document.createElement('tr');
            
            const alternativeCell = document.createElement('td');
            alternativeCell.textContent = alternative;
            
            const scoreCell = document.createElement('td');
            const percentage = (results[alternative].score * 100).toFixed(1);
            scoreCell.textContent = `${percentage}%`;
            
            const rankCell = document.createElement('td');
            rankCell.textContent = results[alternative].rank;
            
            row.appendChild(alternativeCell);
            row.appendChild(scoreCell);
            row.appendChild(rankCell);
            
            resultsTableBody.appendChild(row);
        });
        
        // Generate chart
        updateResultsChart(results);
        
        // Update results summary
        const resultsSummary = document.getElementById('resultsSummary');
        if (resultsSummary) {
            const bestAlternative = sortedAlternatives[0];
            const bestScore = (results[bestAlternative].score * 100).toFixed(1);
            
            resultsSummary.innerHTML = `
                <div class="alert alert-success">
                    <h4>Decision Analysis Complete</h4>
                    <p>Based on your criteria and evaluations, <strong>${bestAlternative}</strong> is the best option with a score of <strong>${bestScore}%</strong>.</p>
                </div>
            `;
        }
        
        // Populate criteria weights list
        const criteriaWeightsList = document.getElementById('criteria-weights-list');
        if (criteriaWeightsList) {
            criteriaWeightsList.innerHTML = '';
            
            state.decision.criteria.forEach(criterion => {
                const weight = state.decision.weights[criterion];
                const percentage = weight ? (weight * 100).toFixed(0) + '%' : 'N/A';
                
                const item = document.createElement('li');
                item.className = 'list-group-item d-flex justify-content-between align-items-center';
                item.innerHTML = `
                    ${criterion}
                    <span class="badge bg-primary rounded-pill">${percentage}</span>
                `;
                criteriaWeightsList.appendChild(item);
            });
        }
        
        // Populate alternatives list
        const alternativesList = document.getElementById('alternatives-list');
        if (alternativesList) {
            alternativesList.innerHTML = '';
            
            state.decision.alternatives.forEach(alternative => {
                const item = document.createElement('li');
                item.className = 'list-group-item';
                item.textContent = alternative;
                alternativesList.appendChild(item);
            });
        }
        
        // Set up dynamic weight adjustment sliders
        setupDynamicWeights(state.decision.criteria, state.decision.weights);
        
        logger.log('RESULTS', 'Results display completed successfully');
    } catch (error) {
        logger.error('RESULTS', 'Error displaying results:', error);
        showError('Error displaying results: ' + error.message);
    }
}

// Update results chart
function updateResultsChart(results) {
    logger.log('CHART', 'Updating results chart', results);
    
    if (!results || Object.keys(results).length === 0) {
        logger.error('CHART', 'No results data provided to update chart');
        return;
    }
    
    try {
        // Get chart container
        const chartContainer = document.getElementById('resultsChartContainer');
        if (!chartContainer) {
            logger.error('CHART', 'Chart container element not found');
            return;
        }
        
        // Get existing chart if any
        let chartCanvas = document.getElementById('resultsChart');
        
        // If there's an existing chart instance, destroy it first
        if (window.resultsChartInstance) {
            window.resultsChartInstance.destroy();
            window.resultsChartInstance = null;
        }
        
        // If canvas doesn't exist, create it
        if (!chartCanvas) {
            chartCanvas = document.createElement('canvas');
            chartCanvas.id = 'resultsChart';
            chartContainer.appendChild(chartCanvas);
        }
        
        // Sort alternatives by score
        const sortedAlternatives = Object.keys(results).sort((a, b) => 
            results[b].score - results[a].score
        );
        
        // Prepare data for chart
        const labels = sortedAlternatives;
        const scores = sortedAlternatives.map(alt => (results[alt].score * 100).toFixed(1));
        const backgroundColors = sortedAlternatives.map((_, index) => {
            if (index === 0) return 'rgba(40, 167, 69, 0.7)'; // First (best) is green
            if (index === sortedAlternatives.length - 1) return 'rgba(220, 53, 69, 0.7)'; // Last is red
            return 'rgba(0, 123, 255, 0.7)'; // Others are blue
        });
        
        // Create chart
        const ctx = chartCanvas.getContext('2d');
        window.resultsChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Score (%)',
                    data: scores,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
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
                                const rank = results[context.label].rank;
                                return `Score: ${context.raw}% (Rank: ${rank})`;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Decision Results',
                        font: {
                            size: 16
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Score (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Alternatives'
                        }
                    }
                }
            }
        });
        
        logger.log('CHART', 'Chart created successfully');
    } catch (error) {
        logger.error('CHART', 'Error creating results chart:', error);
    }
}

// Set up dynamic weight adjustment
function setupDynamicWeights(criteria, initialWeights) {
    logger.log('WEIGHTS', 'Setting up dynamic weights', { criteria, initialWeights });
    
    try {
        // Get the container for the weight sliders
        const weightSlidersContainer = document.getElementById('weightSliders');
        if (!weightSlidersContainer) {
            logger.error('WEIGHTS', 'Weight sliders container not found');
            return;
        }
        
        // Clear existing sliders
        weightSlidersContainer.innerHTML = '';
        
        // Ensure we have weights
        if (!initialWeights || Object.keys(initialWeights).length === 0) {
            logger.log('WEIGHTS', 'No initial weights provided, using equal weights');
            initialWeights = {};
            criteria.forEach(criterion => {
                initialWeights[criterion] = 1 / criteria.length;
            });
        }
        
        // Track if we need to normalize the weights (if they don't sum to 1)
        let totalWeight = 0;
        criteria.forEach(criterion => {
            totalWeight += initialWeights[criterion] || 0;
        });
        
        if (Math.abs(totalWeight - 1) > 0.01) {
            logger.warn('WEIGHTS', `Weights don't sum to 1 (${totalWeight}), will normalize`);
            criteria.forEach(criterion => {
                initialWeights[criterion] = (initialWeights[criterion] || 0) / totalWeight;
            });
        }
        
        // Create a slider for each criterion
        criteria.forEach(criterion => {
            const weight = initialWeights[criterion] || (1 / criteria.length);
            const weightPercentage = Math.round(weight * 100);
            
            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'mb-3';
            
            const labelContainer = document.createElement('div');
            labelContainer.className = 'd-flex justify-content-between align-items-center mb-2';
            
            const label = document.createElement('label');
            label.className = 'form-label mb-0';
            label.textContent = criterion;
            
            const valueDisplay = document.createElement('span');
            valueDisplay.className = 'badge bg-primary';
            valueDisplay.id = `weight-${criterion}-value`;
            valueDisplay.textContent = `${weightPercentage}%`;
            
            labelContainer.appendChild(label);
            labelContainer.appendChild(valueDisplay);
            
            const input = document.createElement('input');
            input.type = 'range';
            input.className = 'form-range weight-slider';
            input.id = `weight-${criterion}`;
            input.min = '0';
            input.max = '100';
            input.step = '1';
            input.value = weightPercentage;
            input.setAttribute('data-criterion', criterion);
            
            // Throttle function to avoid too many recalculations
            let timeout = null;
            const throttledUpdate = function() {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    const newWeight = parseInt(this.value) / 100;
                    valueDisplay.textContent = `${this.value}%`;
                    
                    // Update weight in state
                    state.decision.weights[criterion] = newWeight;
                    
                    // Recalculate results with updated weights
                    recalculateResults();
                    
                    logger.log('WEIGHTS', `Updated weight for ${criterion}: ${newWeight}`);
                }, 100);
            };
            
            input.addEventListener('input', throttledUpdate);
            
            sliderContainer.appendChild(labelContainer);
            sliderContainer.appendChild(input);
            
            weightSlidersContainer.appendChild(sliderContainer);
            logger.log('WEIGHTS', `Created weight slider for ${criterion}: ${weightPercentage}%`);
        });
        
        // Add a "Reset to Equal Weights" button
        const resetButton = document.createElement('button');
        resetButton.className = 'btn btn-outline-secondary mt-3';
        resetButton.textContent = 'Reset to Equal Weights';
        resetButton.onclick = function() {
            const equalWeight = 1 / criteria.length;
            const equalWeightPercentage = Math.round(equalWeight * 100);
            
            criteria.forEach(criterion => {
                const slider = document.getElementById(`weight-${criterion}`);
                const valueDisplay = document.getElementById(`weight-${criterion}-value`);
                
                if (slider && valueDisplay) {
                    slider.value = equalWeightPercentage;
                    valueDisplay.textContent = `${equalWeightPercentage}%`;
                    state.decision.weights[criterion] = equalWeight;
                }
            });
            
            recalculateResults();
            logger.log('WEIGHTS', 'Reset to equal weights');
        };
        
        weightSlidersContainer.appendChild(resetButton);
        logger.log('WEIGHTS', 'Dynamic weights setup completed');
    } catch (error) {
        logger.error('WEIGHTS', 'Error setting up dynamic weights:', error);
        showError('Error setting up weight adjustment sliders: ' + error.message);
    }
}

// Recalculate results with updated weights
function recalculateResults() {
    logger.log('RESULTS', 'Recalculating results with updated weights');
    
    try {
        // Get evaluation data from state
        const evaluations = state.decision.evaluations;
        const criteria = state.decision.criteria;
        const alternatives = state.decision.alternatives;
        const weights = state.decision.weights;
        
        if (!evaluations || !criteria || !alternatives || !weights) {
            logger.error('RESULTS', 'Missing required data for recalculation');
            return;
        }
        
        // Normalize weights to ensure they sum to 1
        let totalWeight = 0;
        criteria.forEach(criterion => {
            totalWeight += weights[criterion] || 0;
        });
        
        if (Math.abs(totalWeight - 1) > 0.01) {
            logger.warn('RESULTS', `Weights don't sum to 1 (${totalWeight}), normalizing`);
            criteria.forEach(criterion => {
                weights[criterion] = (weights[criterion] || 0) / totalWeight;
            });
        }
        
        // Calculate weighted scores for each alternative
        const results = {};
        alternatives.forEach(alternative => {
            let totalScore = 0;
            let possibleScore = 0;
            
            criteria.forEach(criterion => {
                if (!evaluations[alternative] || evaluations[alternative][criterion] === undefined) {
                    logger.warn('RESULTS', `Missing evaluation for ${alternative}/${criterion}`);
                    return;
                }
                
                const score = evaluations[alternative][criterion];
                const weight = weights[criterion];
                
                totalScore += score * weight;
                possibleScore += 10 * weight; // 10 is the max score
            });
            
            // Calculate percentage score
            results[alternative] = {
                score: totalScore,
                percentage: (totalScore / possibleScore) * 100,
                rank: 0 // Will be set after sorting
            };
            
            logger.log('RESULTS', `Calculated score for ${alternative}: ${totalScore} (${results[alternative].percentage.toFixed(2)}%)`);
        });
        
        // Sort alternatives by score and assign ranks
        const sortedAlternatives = Object.keys(results).sort((a, b) => results[b].score - results[a].score);
        sortedAlternatives.forEach((alternative, index) => {
            results[alternative].rank = index + 1;
        });
        
        // Save results to state
        state.decision.results = results;
        saveStateToStorage();
        
        // Update the results display without changing the step
        updateResultsChart(results);
        
        // Update results table
        const resultsTable = document.getElementById('resultsTable');
        if (resultsTable) {
            const resultsTableBody = resultsTable.querySelector('tbody');
            if (resultsTableBody) {
                resultsTableBody.innerHTML = '';
                
                sortedAlternatives.forEach((alternative) => {
                    const row = document.createElement('tr');
                    
                    const alternativeCell = document.createElement('td');
                    alternativeCell.textContent = alternative;
                    
                    const scoreCell = document.createElement('td');
                    const percentage = results[alternative].percentage.toFixed(1);
                    scoreCell.textContent = `${percentage}%`;
                    
                    const rankCell = document.createElement('td');
                    rankCell.textContent = results[alternative].rank;
                    
                    row.appendChild(alternativeCell);
                    row.appendChild(scoreCell);
                    row.appendChild(rankCell);
                    
                    resultsTableBody.appendChild(row);
                });
            }
        }
        
        // Update results summary
        const resultsSummary = document.getElementById('resultsSummary');
        if (resultsSummary) {
            const bestAlternative = sortedAlternatives[0];
            const bestScore = results[bestAlternative].percentage.toFixed(1);
            
            resultsSummary.innerHTML = `
                <div class="alert alert-success">
                    <h4>Decision Analysis Complete</h4>
                    <p>Based on your criteria and evaluations, <strong>${bestAlternative}</strong> is the best option with a score of <strong>${bestScore}%</strong>.</p>
                </div>
            `;
        }
        
        logger.log('RESULTS', 'Results recalculated successfully with updated weights');
        return results;
    } catch (error) {
        logger.error('RESULTS', 'Error recalculating results:', error);
        showError('Error recalculating results: ' + error.message);
        return null;
    }
}

// Helper function to navigate to a specific step (missing in the original code)
function goToStep(stepNumber) {
    logger.log('NAV', `Navigating to step ${stepNumber}`);
    updateStep(stepNumber);
}

// Calculate and display initial results
async function calculateResults() {
    logger.log('RESULTS', 'Calculating initial results');
    
    try {
        // Gather evaluation data from state
        const evaluations = state.decision.evaluations;
        const criteria = state.decision.criteria;
        const alternatives = state.decision.alternatives;
        const weights = state.decision.weights || {};
        
        logger.log('RESULTS', 'Found evaluation data in state:', { evaluations, criteria, alternatives, weights });
        
        // Ensure we have evaluations
        if (!evaluations || Object.keys(evaluations).length === 0) {
            logger.error('RESULTS', 'No evaluation data found in state');
            showError('No evaluation data found. Please complete the evaluation step first.');
            return;
        }
        
        // Ensure we have criteria and alternatives
        if (!criteria || criteria.length === 0 || !alternatives || alternatives.length === 0) {
            logger.error('RESULTS', 'Missing criteria or alternatives data');
            showError('Missing criteria or alternatives data. Please complete all previous steps.');
            return;
        }
        
        // Calculate weights if not already present
        if (!weights || Object.keys(weights).length === 0) {
            logger.log('RESULTS', 'No weights found in state, calculating equal weights');
            state.decision.weights = {};
            criteria.forEach(criterion => {
                state.decision.weights[criterion] = 1 / criteria.length;
            });
        }
        
        // Calculate weighted scores for each alternative
        const results = {};
        alternatives.forEach(alternative => {
            let totalScore = 0;
            let possibleScore = 0;
            
            criteria.forEach(criterion => {
                if (!evaluations[alternative] || evaluations[alternative][criterion] === undefined) {
                    logger.warn('RESULTS', `Missing evaluation for ${alternative}/${criterion}`);
                    return;
                }
                
                const score = evaluations[alternative][criterion];
                const weight = weights[criterion];
                
                totalScore += score * weight;
                possibleScore += 10 * weight; // 10 is the max score
            });
            
            // Calculate percentage score
            results[alternative] = {
                score: totalScore,
                percentage: (totalScore / possibleScore) * 100,
                rank: 0 // Will be set after sorting
            };
            
            logger.log('RESULTS', `Calculated score for ${alternative}: ${totalScore} (${results[alternative].percentage.toFixed(2)}%)`);
        });
        
        // Sort alternatives by score and assign ranks
        const sortedAlternatives = Object.keys(results).sort((a, b) => results[b].score - results[a].score);
        sortedAlternatives.forEach((alternative, index) => {
            results[alternative].rank = index + 1;
        });
        
        logger.log('RESULTS', 'Final calculated results:', results);
        
        // Save results to state
        state.decision.results = results;
        saveStateToStorage();
        
        // Display the results
        displayResults(results);
        
        // Set up dynamic weights if they don't already exist
        setupDynamicWeights(criteria, state.decision.weights);
        
        logger.log('RESULTS', 'Results calculated successfully');
        return results;
    } catch (error) {
        logger.error('RESULTS', 'Error calculating results:', error);
        showError('Error calculating results: ' + error.message);
        return null;
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
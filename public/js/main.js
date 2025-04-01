/**
 * Decision Matrix Application
 * Client-side JavaScript
 */

// State management
let state = {
    currentStep: 1,
    decisionId: null,
    decision: {
        name: '',
        criteria: [],
        weights: {},
        alternatives: [],
        evaluations: {},
        results: {}
    },
    originalWeights: {}
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
    warn: function(context, message, data) {
        console.warn(`[WARN][${context}] ${message}`, data || '');
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
    
    // Update key elements for global access
    // Instead of reassigning the const elements object, update its properties
    elements.stepContainers = document.querySelectorAll('.step-container');
    elements.stepIndicators = document.querySelectorAll('.step-indicator .step');
    elements.forms = document.querySelectorAll('form');
    
    // Load state from storage
    loadStateFromStorage();
    
    // Setup event handlers
    setupFormHandlers();
    setupDynamicControls();
    setupRemoveButtons();
    setupStepNavigation();
    setupSaveToAccount();
    setupDescriptionToggles();
    initializeDynamicForms(); // Add default criteria and alternatives fields
    
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
    // Don't try to use localStorage at all
    logger.log('STORAGE', 'Storage access not available, using memory state');
    
    // Check if we have a decision ID in the form
    const decisionIdInput = document.getElementById('decisionId');
    if (decisionIdInput && !state.decisionId) {
        state.decisionId = decisionIdInput.value;
        logger.log('STORAGE', 'Retrieved decision ID from form', state.decisionId);
    }
    
    return null;
}

// Save state to localStorage
function saveStateToStorage() {
    // Don't try to use localStorage at all
    logger.log('STORAGE', 'Storage access not available, using memory state');
    
    // Ensure decision ID is set
    if (!state.decisionId) {
        const decisionIdInput = document.getElementById('decisionId');
        if (decisionIdInput) {
            state.decisionId = decisionIdInput.value;
            logger.log('STORAGE', 'Set decision ID from form during save', state.decisionId);
        }
    }
    
    return;
}

// Reset application state
function resetState() {
    logger.log('STATE', 'Resetting state');
    
    // First, destroy any existing chart instance
    if (window.resultsChartInstance) {
        logger.log('CHART', 'Destroying existing chart instance');
        window.resultsChartInstance.destroy();
        window.resultsChartInstance = null;
    }
    
    // Clear state
    state = {
        currentStep: 1,
        decisionId: null,
        decision: {
            name: '',
            criteria: [],
            weights: {},
            alternatives: [],
            evaluations: {},
            results: {}
        },
        originalWeights: {}
    };
    
    // Clear any existing form data
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.reset();
        form.classList.remove('was-validated');
    });
    
    // Clear any dynamic content
    const criteriaList = document.getElementById('criteriaList');
    if (criteriaList) criteriaList.innerHTML = '';
    
    const alternativesList = document.getElementById('alternativesList');
    if (alternativesList) alternativesList.innerHTML = '';
    
    const evaluationMatrix = document.getElementById('evaluationMatrix');
    if (evaluationMatrix) evaluationMatrix.innerHTML = '';
    
    const weightSliders = document.getElementById('weightSliders');
    if (weightSliders) weightSliders.innerHTML = '';
    
    // Clear results display
    const resultsTable = document.querySelector('#resultsTable tbody');
    if (resultsTable) resultsTable.innerHTML = '';
    
    const resultsSummary = document.getElementById('resultsSummary');
    if (resultsSummary) resultsSummary.innerHTML = '';
    
    // Clear local storage
    try {
        localStorage.removeItem('decisionState');
    } catch (error) {
        // Ignore storage errors
    }
    
    // Hide all steps except first
    document.querySelectorAll('.step-container').forEach((container, index) => {
        if (index === 0) {
            container.classList.add('active');
            container.style.display = 'block';
        } else {
            container.classList.remove('active');
            container.style.display = 'none';
        }
    });
    
    // Reset step indicators
    document.querySelectorAll('.step-indicator .step').forEach((indicator, index) => {
        if (index === 0) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
    
    // Clear chart container
    const chartContainer = document.getElementById('resultsChartContainer');
    if (chartContainer) {
        chartContainer.innerHTML = '<canvas id="resultsChart"></canvas>';
    }
    
    // Focus on decision name input
    const decisionNameInput = document.getElementById('decisionName');
    if (decisionNameInput) {
        decisionNameInput.value = '';
        decisionNameInput.focus();
    }
    
    logger.log('STATE', 'State reset complete');
    return state;
}

// Setup form handlers
function setupFormHandlers() {
    logger.log('SETUP', 'Setting up form handlers');
    
    // Direct click handler for the name form "Next" button
    const nameNextBtn = document.getElementById('nameFormNextBtn');
    console.log("Name Next Button:", nameNextBtn);
    
    if (nameNextBtn) {
        // Remove any existing event listeners by replacing with clone
        const newNameNextBtn = nameNextBtn.cloneNode(true);
        nameNextBtn.parentNode.replaceChild(newNameNextBtn, nameNextBtn);
        
        newNameNextBtn.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent form submission
            console.log("Name Next Button Clicked!");
            
            // Get decision ID from the hidden input
            const decisionIdInput = document.getElementById('decisionId');
            if (decisionIdInput) {
                state.decisionId = decisionIdInput.value;
                logger.log('FORM', 'Setting decision ID', state.decisionId);
            } else {
                logger.error('FORM', 'Decision ID input not found');
            }
            
            // Get name input value
            const nameInput = document.getElementById('decisionName');
            if (!nameInput) {
                console.error("Decision name input element not found");
                return;
            }
            
            const nameValue = nameInput.value.trim();
            console.log("Name input value:", nameValue);
            
            if (!nameValue) {
                // Show validation error
                nameInput.classList.add('is-invalid');
                return;
            }
            
            // Remove validation error if present
            nameInput.classList.remove('is-invalid');
            
            // Update state with the name
            state.decision.name = nameValue;
            state.currentStep = 2;
            
            // Save state to storage
            saveStateToStorage();
            
            // Update UI directly without relying on storage
            document.querySelectorAll('.step-container').forEach((container, index) => {
                if (index + 1 === 2) {
                    container.classList.add('active');
                    container.style.display = 'block';
                } else {
                    container.classList.remove('active');
                    container.style.display = 'none';
                }
            });
            
            // Update step indicators
            document.querySelectorAll('.step-indicator .step').forEach((indicator, index) => {
                if (index + 1 <= 2) {
                    indicator.classList.add('active');
                } else {
                    indicator.classList.remove('active');
                }
            });
            
            console.log("Navigation complete");
        });
        
        console.log("Event listener attached to nameNextBtn");
    } else {
        console.error("nameFormNextBtn element not found");
    }
    
    // Handle remaining forms
    const formIds = ['criteriaForm', 'weightsForm', 'alternativesForm'];
    formIds.forEach((formId, index) => {
        const form = document.getElementById(formId);
        if (form) {
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            newForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                console.log(`Form ${formId} submitted`);
                await handleFormSubmit(newForm, index + 2);
            });

            // Add direct handlers for the submit buttons
            const submitBtn = newForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.addEventListener('click', async (event) => {
                    event.preventDefault();
                    console.log(`${formId} submit button clicked`);
                    await handleFormSubmit(newForm, index + 2);
                });
            }
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
        const newAddCriteriaBtn = addCriteriaBtn.cloneNode(true);
        addCriteriaBtn.parentNode.replaceChild(newAddCriteriaBtn, addCriteriaBtn);
        newAddCriteriaBtn.addEventListener('click', function(event) {
            logger.log('CLICK', 'Add criteria button clicked');
            addCriteriaField(event);
        });
    }
    
    // Setup add alternative button
    if (addAlternativeBtn) {
        const newAddAlternativeBtn = addAlternativeBtn.cloneNode(true);
        addAlternativeBtn.parentNode.replaceChild(newAddAlternativeBtn, addAlternativeBtn);
        newAddAlternativeBtn.addEventListener('click', function(event) {
            logger.log('CLICK', 'Add alternative button clicked');
            addAlternativeField(event);
        });
    }
    
    // Setup new decision button
    if (newDecisionBtn) {
        const newNewDecisionBtn = newDecisionBtn.cloneNode(true);
        newDecisionBtn.parentNode.replaceChild(newNewDecisionBtn, newDecisionBtn);
        newNewDecisionBtn.addEventListener('click', function() {
            logger.log('CLICK', 'New decision button clicked');
            if (confirm('Are you sure you want to start a new decision? All current data will be lost.')) {
                logger.log('NAVIGATION', 'Starting new decision');
                
                // Redirect to the app page to start a new decision
                window.location.href = '/app';
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
        // Remove existing listeners by cloning and replacing
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', function(event) {
            event.preventDefault();
            console.log('Description toggle clicked');
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
    logger.log('SETUP', 'Initializing dynamic forms');
    
    // Create initial criteria fields
    const criteriaList = document.getElementById('criteriaList');
    if (criteriaList) {
        // Always ensure there are at least 2 criteria fields
        if (criteriaList.children.length < 2) {
            // Clear existing items if any
            criteriaList.innerHTML = '';
            
            // Add two default criteria fields
            for (let i = 0; i < 2; i++) {
                addCriteriaField();
            }
        }
    }
    
    // Create initial alternatives fields
    const alternativesList = document.getElementById('alternativesList');
    if (alternativesList) {
        // Always ensure there are at least 2 alternative fields
        if (alternativesList.children.length < 2) {
            // Clear existing items if any
            alternativesList.innerHTML = '';
            
            // Add two default alternative fields
            for (let i = 0; i < 2; i++) {
                addAlternativeField();
            }
        }
    }
    
    logger.log('SETUP', 'Dynamic forms initialized');
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
                
                // Update state
                state.decision.criteria = criteria;
                state.decision.criteriaDescriptions = descriptions;
                state.currentStep = 3;
                
                // Prepare weight fields for step 3
                prepareWeightFields(criteria);
                
                // Navigate to step 3 directly
                document.querySelectorAll('.step-container').forEach((container, index) => {
                    if (index + 1 === 3) {
                        container.classList.add('active');
                        container.style.display = 'block';
                    } else {
                        container.classList.remove('active');
                        container.style.display = 'none';
                    }
                });
                
                // Update step indicators
                document.querySelectorAll('.step-indicator .step').forEach((indicator, index) => {
                    if (index + 1 <= 3) {
                        indicator.classList.add('active');
                    } else {
                        indicator.classList.remove('active');
                    }
                });
                
                console.log("Navigation to step 3 complete");
                return true;
                break;
                
            case 'weightsForm':
                const weights = {};
                let totalWeightValue = 0;
                
                state.decision.criteria.forEach(criterion => {
                    const weight = parseFloat(formData.get(`weights[${criterion}]`)) || 0;
                    weights[criterion] = weight;
                    totalWeightValue += weight;
                });
                
                // If weights don't sum to 100%, normalize them
                if (totalWeightValue !== 100 && totalWeightValue > 0) {
                    logger.debug('WEIGHTS', `Normalizing weights from ${totalWeightValue}% to 100%`);
                    state.decision.criteria.forEach(criterion => {
                        weights[criterion] = (weights[criterion] / totalWeightValue) * 100;
                    });
                }
                
                // Update state directly
                state.decision.weights = weights;
                state.currentStep = 4;
                
                // Navigate to step 4 directly
                document.querySelectorAll('.step-container').forEach((container, index) => {
                    if (index + 1 === 4) {
                        container.classList.add('active');
                        container.style.display = 'block';
                    } else {
                        container.classList.remove('active');
                        container.style.display = 'none';
                    }
                });
                
                // Update step indicators
                document.querySelectorAll('.step-indicator .step').forEach((indicator, index) => {
                    if (index + 1 <= 4) {
                        indicator.classList.add('active');
                    } else {
                        indicator.classList.remove('active');
                    }
                });
                
                console.log("Navigation to step 4 complete");
                return true;
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
                
                // Update state directly
                state.decision.alternatives = alternatives;
                state.decision.alternativeDescriptions = altDescriptions;
                state.currentStep = 5;
                
                // Prepare evaluation matrix for step 5
                prepareEvaluationMatrix(alternatives, state.decision.criteria);
                
                // Navigate to step 5 directly
                document.querySelectorAll('.step-container').forEach((container, index) => {
                    if (index + 1 === 5) {
                        container.classList.add('active');
                        container.style.display = 'block';
                    } else {
                        container.classList.remove('active');
                        container.style.display = 'none';
                    }
                });
                
                // Update step indicators
                document.querySelectorAll('.step-indicator .step').forEach((indicator, index) => {
                    if (index + 1 <= 5) {
                        indicator.classList.add('active');
                    } else {
                        indicator.classList.remove('active');
                    }
                });
                
                console.log("Navigation to step 5 complete");
                return true;
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
        explanation.textContent = 'How important is each criterion? Set the weight as a percentage (0-100%). Ideally, weights should sum to 100%.';
        form.appendChild(explanation);
        
        // Create fields container
        const fieldsContainer = document.createElement('div');
        fieldsContainer.className = 'weight-fields-container';
        form.appendChild(fieldsContainer);
        
        // Ensure we have weights or initialize with equal percentages
        if (!state.decision.weights) {
            state.decision.weights = {};
        }
        
        // If weights aren't set, initialize with equal percentages
        const defaultPercentage = Math.round(100 / criteria.length);
        let hasSetWeights = false;
        
        criteria.forEach(criterion => {
            if (state.decision.weights[criterion]) {
                hasSetWeights = true;
            } else {
                state.decision.weights[criterion] = defaultPercentage;
            }
        });
        
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
            valueDisplay.textContent = Math.round(state.decision.weights[criterion] || defaultPercentage) + '%';
            
            labelContainer.appendChild(label);
            labelContainer.appendChild(valueDisplay);
            
            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'range-container';
            
            const input = document.createElement('input');
            input.type = 'range';
            input.className = 'form-range';
            input.id = `weights[${criterion}]`;
            input.name = `weights[${criterion}]`;
            input.min = '0';
            input.max = '100';
            input.step = '1';
            input.required = true;
            input.value = Math.round(state.decision.weights[criterion] || defaultPercentage);
            
            // Update value display when slider moves
            input.addEventListener('input', function() {
                valueDisplay.textContent = this.value + '%';
                updateTotalWeightDisplay();
            });
            
            sliderContainer.appendChild(input);
            
            // Create tick marks for the slider (optional)
            const tickMarks = document.createElement('div');
            tickMarks.className = 'd-flex justify-content-between px-2 mt-1';
            for (let i = 0; i <= 100; i += 20) {
                const tick = document.createElement('small');
                tick.className = 'text-muted';
                tick.textContent = i + '%';
                tickMarks.appendChild(tick);
            }
            
            field.appendChild(labelContainer);
            field.appendChild(sliderContainer);
            field.appendChild(tickMarks);
            fieldsContainer.appendChild(field);
        });
        
        // Add a total weight indicator
        const totalWeightContainer = document.createElement('div');
        totalWeightContainer.className = 'alert alert-info mt-3 mb-4';
        totalWeightContainer.id = 'total-weight-container';
        
        const totalWeightText = document.createElement('div');
        totalWeightText.id = 'total-weight-text';
        totalWeightText.className = 'mb-2';
        totalWeightText.textContent = 'Total weight: 0%';
        
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress';
        
        const progressBar = document.createElement('div');
        progressBar.id = 'total-weight-progress';
        progressBar.className = 'progress-bar';
        progressBar.setAttribute('role', 'progressbar');
        progressBar.style.width = '0%';
        
        progressContainer.appendChild(progressBar);
        totalWeightContainer.appendChild(totalWeightText);
        totalWeightContainer.appendChild(progressContainer);
        
        fieldsContainer.appendChild(totalWeightContainer);
        
        // Function to update the total weight display
        window.updateTotalWeightDisplay = function() {
            let totalWeight = 0;
            criteria.forEach(criterion => {
                const weightInput = document.getElementById(`weights[${criterion}]`);
                if (weightInput) {
                    totalWeight += parseInt(weightInput.value, 10) || 0;
                }
            });
            
            const totalWeightText = document.getElementById('total-weight-text');
            const progressBar = document.getElementById('total-weight-progress');
            
            if (totalWeightText && progressBar) {
                totalWeightText.textContent = `Total weight: ${totalWeight}%`;
                
                // Update progress bar
                const progressWidth = Math.min(totalWeight, 100);
                progressBar.style.width = `${progressWidth}%`;
                
                // Set color based on how close to 100% we are
                if (totalWeight === 100) {
                    progressBar.className = 'progress-bar bg-success';
                    totalWeightText.className = 'mb-2 text-success';
                } else if (totalWeight > 90 && totalWeight < 110) {
                    progressBar.className = 'progress-bar bg-warning';
                    totalWeightText.className = 'mb-2 text-warning';
                } else {
                    progressBar.className = 'progress-bar bg-danger';
                    totalWeightText.className = 'mb-2 text-danger';
                }
            }
        };
        
        // Initialize the total weight display
        setTimeout(updateTotalWeightDisplay, 100);
        
        // Add the submit button
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'btn btn-primary mt-3';
        submitBtn.textContent = 'Next';
        form.appendChild(submitBtn);
        
        // Add form submission listener
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmit(this, 3);
        });
        
        return true;
    } catch (error) {
        logger.error('WEIGHTS', 'Error preparing weight fields', error);
        return false;
    }
}

// Add a new criteria field
function addCriteriaField(event) {
    logger.log('CRITERIA', 'Adding new criteria field');
    if (event) event.preventDefault();
    
    const criteriaList = document.getElementById('criteriaList');
    if (!criteriaList) {
        logger.error('CRITERIA', 'Criteria list container not found');
        return;
    }
    
    // Determine the index for placeholder text
    const criteriaCount = criteriaList.querySelectorAll('.criteria-item').length + 1;
    const placeholderText = `Criterion ${criteriaCount}`;
    
    const newItem = document.createElement('div');
    newItem.className = 'criteria-item';
    newItem.innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control" name="criteria[]" placeholder="${placeholderText}" required>
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
    if (event) event.preventDefault();
    
    const alternativesList = document.getElementById('alternativesList');
    if (!alternativesList) {
        logger.error('ALTERNATIVES', 'Alternatives list container not found');
        return;
    }
    
    // Determine the index for placeholder text
    const alternativesCount = alternativesList.querySelectorAll('.alternative-item').length + 1;
    const placeholderText = `Alternative ${alternativesCount}`;
    
    const newItem = document.createElement('div');
    newItem.className = 'alternative-item';
    newItem.innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control" name="alternatives[]" placeholder="${placeholderText}" required>
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
        
        // If state.decisionId is not set, try to get it from the form
        if (!state.decisionId) {
            const decisionIdInput = document.getElementById('decisionId');
            if (decisionIdInput) {
                state.decisionId = decisionIdInput.value;
                logger.log('RESULTS_DISPLAY', 'Retrieved decision ID from form', state.decisionId);
            } else {
                // Generate a new decision ID if none exists
                state.decisionId = 'decision_' + Date.now();
                logger.log('RESULTS_DISPLAY', 'Generated new decision ID', state.decisionId);
            }
        }
        
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
        
        // Format the results for display - ensure scores are between 0 and 100
        // First find the highest score to normalize others against
        let maxScore = 0;
        Object.values(results).forEach(result => {
            // Check if result is an object with a score property (new format)
            const score = typeof result === 'object' && result.score !== undefined ? result.score : result;
            if (score > maxScore) maxScore = score;
        });
        
        // Now normalize and format
        const formattedResults = Object.entries(results).map(([alternative, result]) => {
            // Check if result is an object with a score property (new format)
            const score = typeof result === 'object' && result.score !== undefined ? result.score : result;
            const rank = typeof result === 'object' && result.rank !== undefined ? result.rank : 0;
            
            // Ensure score is a number and format it
            const numericScore = parseFloat(score) || 0;
            
            return {
                alternative,
                score: numericScore.toFixed(2),
                rank: rank || 0
            };
        }).sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
        
        logger.log('RESULTS_DISPLAY', 'Formatted results', formattedResults);

        // Display decision name
        const resultDecisionName = document.getElementById('resultDecisionName');
        if (resultDecisionName) {
            resultDecisionName.textContent = currentState.name;
        }
        
        // Populate results table - use the correct ID from the HTML
        const resultsTableBody = document.querySelector('#resultsTable tbody');
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
                <td>${result.score}</td>
                <td>#${index + 1}</td>
            `;
            resultsTableBody.appendChild(row);
        });
        
        // Populate criteria and weights list
        const criteriaWeightsList = document.getElementById('criteria-weights-list');
        if (criteriaWeightsList) {
            criteriaWeightsList.innerHTML = '';
            
            currentState.criteria.forEach(criterion => {
                const rawWeight = currentState.weights[criterion];
                // Convert weight to percentage if needed
                let weightValue;
                
                if (typeof rawWeight === 'number') {
                    if (rawWeight >= 0 && rawWeight <= 1) {
                        // Convert decimal weights (0-1) to percentage (0-100%)
                        weightValue = Math.round(rawWeight * 100);
                    } else if (rawWeight >= 1 && rawWeight <= 10 && currentState.criteria.length > 1) {
                        // Convert old scale (1-10) to percentage if multiple criteria exist
                        weightValue = Math.round((rawWeight / 10) * 100);
                    } else {
                        // Assume it's already a percentage
                        weightValue = Math.round(rawWeight);
                    }
                } else {
                    // Default to equal distribution if weight is missing or invalid
                    weightValue = Math.round(100 / currentState.criteria.length);
                }
                
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.innerHTML = `
                    ${criterion}
                    <span class="badge bg-primary rounded-pill">Weight: ${weightValue}%</span>
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
        
        // Set up collaboration buttons if present
        setupCollaborationButtons(currentState);
        
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

// Set up collaboration buttons
function setupCollaborationButtons(currentState) {
    // Invite for Criteria Weights button
    const inviteCriteriaBtn = document.getElementById('invite-criteria-weights-btn');
    if (inviteCriteriaBtn) {
        // Remove any existing event listeners
        const newInviteCriteriaBtn = inviteCriteriaBtn.cloneNode(true);
        inviteCriteriaBtn.parentNode.replaceChild(newInviteCriteriaBtn, inviteCriteriaBtn);
        
        newInviteCriteriaBtn.addEventListener('click', function() {
            navigateToCollaborationSetup('criteria-weights', currentState);
        });
    }
    
    // Invite for Alternative Evaluation button
    const inviteAlternativesBtn = document.getElementById('invite-alternatives-eval-btn');
    if (inviteAlternativesBtn) {
        // Remove any existing event listeners
        const newInviteAlternativesBtn = inviteAlternativesBtn.cloneNode(true);
        inviteAlternativesBtn.parentNode.replaceChild(newInviteAlternativesBtn, inviteAlternativesBtn);
        
        newInviteAlternativesBtn.addEventListener('click', function() {
            navigateToCollaborationSetup('alternatives-evaluation', currentState);
        });
    }
}

// Navigate to collaboration setup page
async function navigateToCollaborationSetup(type, currentState) {
    try {
        if (!state.decisionId) {
            throw new Error('Decision ID is missing');
        }
        
        logger.log('COLLABORATION', `Setting up collaboration for ${type}`, {
            decisionId: state.decisionId,
            name: currentState.name
        });
        
        // First, ensure the decision is saved
        if (document.getElementById('save-to-account-btn')) {
            // If the user is logged in, we can save the decision first
            try {
                const saveData = {
                    decisionId: state.decisionId,
                    name: currentState.name,
                    criteria: currentState.criteria,
                    weights: currentState.weights,
                    alternatives: currentState.alternatives,
                    evaluations: currentState.evaluations,
                    results: currentState.results
                };
                
                const response = await fetch('/save-to-account', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(saveData)
                });
                
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.error || 'Failed to save decision');
                }
            } catch (saveError) {
                logger.warn('COLLABORATION', 'Could not save decision, proceeding anyway', saveError);
                // We will continue without saving
            }
        }
        
        // Navigate to the collaboration setup page
        window.location.href = `/collaboration-setup/${state.decisionId}/${type}`;
    } catch (error) {
        logger.error('COLLABORATION', 'Error setting up collaboration', error);
        showError('Error setting up collaboration: ' + error.message);
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
            const scores = formattedResults.map(result => result.score);
            
            logger.log('CHART', 'Chart data prepared', { labels, scores });
            
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
                        data: scores,
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
                                    const rank = context.dataIndex + 1;
                                    return `Score: ${context.raw} (Rank: ${rank})`;
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
                            title: {
                                display: true,
                                text: 'Score'
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
                
                // Set initial value in state
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
                
                // Add the input to the slider container
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
        
        // Show loading state
        const calculateButton = event.target;
        const originalButtonText = calculateButton.innerHTML;
        calculateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculating...';
        calculateButton.disabled = true;
        
        // Prepare data for submission
        const submissionData = {
            step: 5,
            data: {
                id: state.decisionId,
                evaluations: evaluations
            },
            currentState: state.decision
        };
        
        // Submit data to the server
        fetch('/save-step', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(submissionData)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                logger.log('EVALUATION', 'Evaluation data saved successfully', result);
                
                // Check if we should redirect to view-decision page
                if (result.redirect) {
                    // Redirect to the view-decision page
                    logger.log('EVALUATION', 'Redirecting to view-decision page', result.redirect);
                    window.location.href = result.redirect;
                    return;
                }
                
                // If no redirect, fall back to the old behavior
                // Update state
                state.decision.evaluations = evaluations;
                state.currentStep = 6;
                
                // Navigate to step 6 directly
                document.querySelectorAll('.step-container').forEach((container, index) => {
                    if (index + 1 === 6) {
                        container.classList.add('active');
                        container.style.display = 'block';
                    } else {
                        container.classList.remove('active');
                        container.style.display = 'none';
                    }
                });
                
                // Update step indicators
                document.querySelectorAll('.step-indicator .step').forEach((indicator, index) => {
                    if (index + 1 <= 6) {
                        indicator.classList.add('active');
                    } else {
                        indicator.classList.remove('active');
                    }
                });
                
                // Calculate and display results
                if (result.results) {
                    state.decision.results = result.results;
                    saveStateToStorage();
                }
                
                recalculateResults();
                
                console.log("Navigation to step 6 (results) complete");
            } else {
                // Handle error
                logger.error('EVALUATION', 'Error saving evaluation data', result.error);
                showError('Error: ' + (result.error || 'Failed to save evaluation data'));
            }
        })
        .catch(error => {
            logger.error('EVALUATION', 'Error in fetch operation', error);
            showError('Connection error. Please try again.');
        })
        .finally(() => {
            // Reset button state
            calculateButton.innerHTML = originalButtonText;
            calculateButton.disabled = false;
        });
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
    try {
        logger.log('RESULTS_DISPLAY', 'Displaying results', results);
        
        // Validate the results object
        if (!results || typeof results !== 'object' || Object.keys(results).length === 0) {
            logger.error('RESULTS_DISPLAY', 'Invalid or empty results object', results);
            showError('No valid results to display.');
            return;
        }
        
        // Make sure we're on the results step
        updateStep(6);
        
        // Display decision name
        const resultDecisionName = document.getElementById('resultDecisionName');
        if (resultDecisionName && state.decision.name) {
            resultDecisionName.textContent = state.decision.name;
        }
        
        // Show the results
        showResults(results, state.decision);
        
        // Update the results chart
        updateResultsChart(results);
        
        // Setup dynamic weight sliders
        setupDynamicWeights(state.decision.criteria, state.decision.weights);
        
        logger.log('RESULTS_DISPLAY', 'Results displayed successfully');
    } catch (error) {
        logger.error('RESULTS_DISPLAY', 'Error displaying results:', error);
        showError('An error occurred while displaying results.');
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
        // Always destroy any existing chart instance first
        if (window.resultsChartInstance) {
            logger.log('CHART', 'Destroying existing chart instance');
            window.resultsChartInstance.destroy();
        }
        
        // Get chart container
        const chartContainer = document.getElementById('resultsChartContainer');
        if (!chartContainer) {
            logger.error('CHART', 'Chart container element not found');
            return;
        }
        
        // Completely remove any existing canvas
        chartContainer.innerHTML = '';
        
        // Create a new canvas element with a unique ID
        const chartCanvas = document.createElement('canvas');
        chartCanvas.id = 'resultsChart_' + Date.now();
        chartContainer.appendChild(chartCanvas);
        
        // Get the alternatives and scores from results
        const sortedResults = Object.entries(results)
            .map(([alt, result]) => {
                const score = typeof result === 'object' && result.score !== undefined 
                    ? parseFloat(result.score) 
                    : parseFloat(result);
                return { alt, score };
            })
            .sort((a, b) => b.score - a.score);
        
        const labels = sortedResults.map(item => item.alt);
        const scores = sortedResults.map(item => item.score);
        
        const backgroundColors = sortedResults.map((_, index) => {
            if (index === 0) return 'rgba(40, 167, 69, 0.7)'; // First (best) is green
            if (index === sortedResults.length - 1) return 'rgba(220, 53, 69, 0.7)'; // Last is red
            return 'rgba(0, 123, 255, 0.7)'; // Others are blue
        });
        
        // Create chart
        const ctx = chartCanvas.getContext('2d');
        
        // Add a small delay to ensure the DOM has updated
        setTimeout(() => {
            try {
                window.resultsChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Score',
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
                                        const rank = context.dataIndex + 1;
                                        return `Score: ${context.raw} (Rank: ${rank})`;
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
                                title: {
                                    display: true,
                                    text: 'Score'
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
            } catch (chartError) {
                logger.error('CHART', 'Error creating chart in timeout:', chartError);
            }
        }, 50);
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
        
        // Store the original weights for reset functionality
        if (!state.originalWeights || Object.keys(state.originalWeights).length === 0) {
            state.originalWeights = {};
            criteria.forEach(criterion => {
                // Handle different weight formats and convert to percentage (0-100)
                const origWeight = initialWeights[criterion];
                if (origWeight === undefined || origWeight === null) {
                    // Default value if weight is not set
                    state.originalWeights[criterion] = 100 / criteria.length;
                } else if (origWeight >= 0 && origWeight <= 1) {
                    // Convert decimal weights (0-1) to percentage (0-100)
                    state.originalWeights[criterion] = Math.round(origWeight * 100);
                } else {
                    // Use raw value, assuming it's already a percentage or old 1-10 scale
                    // For old 1-10 scale, will convert below
                    state.originalWeights[criterion] = origWeight;
                }
            });
            logger.log('WEIGHTS', 'Original weights stored:', state.originalWeights);
        }
        
        // Create a slider for each criterion
        criteria.forEach(criterion => {
            // Handle different weight formats and convert to percentage (0-100)
            let weight = initialWeights[criterion];
            
            // Convert weight to percentage format
            if (weight === undefined || weight === null) {
                // Default value if weight is not set
                weight = Math.round(100 / criteria.length);
            } else if (weight >= 0 && weight <= 1) {
                // Convert decimal weights (0-1) to percentage (0-100)
                weight = Math.round(weight * 100);
            } else if (weight >= 1 && weight <= 10 && criteria.length > 0) {
                // Convert old scale (1-10) to percentage
                // Only do this conversion if we have specific evidence it's the old scale
                // (values between 1-10 and multiple criteria)
                weight = Math.round((weight / 10) * 100);
            }
            
            // Ensure weight is within 0-100 range
            weight = Math.max(0, Math.min(100, Math.round(weight)));
            
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
            valueDisplay.textContent = weight + '%';
            
            labelContainer.appendChild(label);
            labelContainer.appendChild(valueDisplay);
            
            const input = document.createElement('input');
            input.type = 'range';
            input.className = 'form-range weight-slider';
            input.id = `weight-${criterion}`;
            input.min = '0';
            input.max = '100';
            input.step = '1';
            input.value = weight;
            input.setAttribute('data-criterion', criterion);
            
            // Simple function to update weight value without normalization
            const updateWeight = function() {
                const newWeight = parseInt(this.value);
                valueDisplay.textContent = newWeight + '%';
                
                // Update weight in state directly
                state.decision.weights[criterion] = newWeight;
                
                // Recalculate results with updated weights
                recalculateResults();
                
                logger.log('WEIGHTS', `Updated weight for ${criterion}: ${newWeight}%`);
            };
            
            input.addEventListener('input', updateWeight);
            input.addEventListener('change', updateWeight);
            
            sliderContainer.appendChild(labelContainer);
            sliderContainer.appendChild(input);
            
            weightSlidersContainer.appendChild(sliderContainer);
            logger.log('WEIGHTS', `Created weight slider for ${criterion}: ${weight}%`);
        });
        
        // Add button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'd-flex gap-2 mt-3';
        
        // Add a "Reset to Equal Weights" button
        const resetEqualButton = document.createElement('button');
        resetEqualButton.className = 'btn btn-outline-secondary';
        resetEqualButton.textContent = 'Reset to Equal Weights';
        resetEqualButton.onclick = function() {
            const equalWeight = Math.round(100 / criteria.length);
            criteria.forEach(criterion => {
                state.decision.weights[criterion] = equalWeight; // Equal percentage
            });
            
            // Update sliders to show the new values
            criteria.forEach(criterion => {
                const slider = document.getElementById(`weight-${criterion}`);
                const valueDisplay = document.getElementById(`weight-${criterion}-value`);
                
                if (slider && valueDisplay) {
                    slider.value = equalWeight;
                    valueDisplay.textContent = equalWeight + '%';
                }
            });
            
            recalculateResults();
            logger.log('WEIGHTS', `Reset to equal weights (all set to ${equalWeight}%)`);
        };
        
        // Add a "Reset to Original Weights" button
        const resetOriginalButton = document.createElement('button');
        resetOriginalButton.className = 'btn btn-outline-primary';
        resetOriginalButton.textContent = 'Reset to Original Weights';
        resetOriginalButton.onclick = function() {
            if (state.originalWeights && Object.keys(state.originalWeights).length > 0) {
                criteria.forEach(criterion => {
                    const origWeight = state.originalWeights[criterion] || Math.round(100 / criteria.length);
                    state.decision.weights[criterion] = origWeight;
                });
                
                // Update sliders to show the original values
                criteria.forEach(criterion => {
                    const slider = document.getElementById(`weight-${criterion}`);
                    const valueDisplay = document.getElementById(`weight-${criterion}-value`);
                    
                    if (slider && valueDisplay) {
                        const weight = state.originalWeights[criterion] || Math.round(100 / criteria.length);
                        slider.value = weight;
                        valueDisplay.textContent = weight + '%';
                    }
                });
                
                recalculateResults();
                logger.log('WEIGHTS', 'Reset to original weights');
            } else {
                logger.error('WEIGHTS', 'Original weights not found');
                showError('Original weights not found');
            }
        };
        
        buttonContainer.appendChild(resetEqualButton);
        buttonContainer.appendChild(resetOriginalButton);
        weightSlidersContainer.appendChild(buttonContainer);
        
        // Add a total weight indicator
        const totalWeightContainer = document.createElement('div');
        totalWeightContainer.className = 'alert alert-info mt-3';
        totalWeightContainer.id = 'total-weight-container';
        
        const totalWeightText = document.createElement('div');
        totalWeightText.id = 'total-weight-text';
        totalWeightText.className = 'mb-2';
        
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress';
        
        const progressBar = document.createElement('div');
        progressBar.id = 'total-weight-progress';
        progressBar.className = 'progress-bar';
        progressBar.setAttribute('role', 'progressbar');
        
        progressContainer.appendChild(progressBar);
        totalWeightContainer.appendChild(totalWeightText);
        totalWeightContainer.appendChild(progressContainer);
        
        weightSlidersContainer.appendChild(totalWeightContainer);
        
        // Function to update the total weight display
        const updateTotalWeightDisplay = function() {
            let totalWeight = 0;
            criteria.forEach(criterion => {
                const slider = document.getElementById(`weight-${criterion}`);
                if (slider) {
                    totalWeight += parseInt(slider.value, 10) || 0;
                }
            });
            
            if (totalWeightText && progressBar) {
                totalWeightText.textContent = `Total weight: ${totalWeight}%`;
                
                // Update progress bar
                const progressWidth = Math.min(totalWeight, 100);
                progressBar.style.width = `${progressWidth}%`;
                
                // Set color based on how close to 100% we are
                if (totalWeight === 100) {
                    progressBar.className = 'progress-bar bg-success';
                    totalWeightText.className = 'mb-2 text-success';
                } else if (totalWeight > 90 && totalWeight < 110) {
                    progressBar.className = 'progress-bar bg-warning';
                    totalWeightText.className = 'mb-2 text-warning';
                } else {
                    progressBar.className = 'progress-bar bg-danger';
                    totalWeightText.className = 'mb-2 text-danger';
                }
            }
        };
        
        // Initialize the total weight display
        setTimeout(updateTotalWeightDisplay, 100);
        
        logger.log('WEIGHTS', 'Dynamic weights setup completed');
    } catch (error) {
        logger.error('WEIGHTS', 'Error setting up dynamic weights:', error);
        showError('Error setting up weight adjustment sliders: ' + error.message);
    }
}

// Recalculate results with updated weights
function recalculateResults() {
    logger.log('RESULTS', 'Recalculating results with new weights');
    
    try {
        // Gather data needed for calculation
        const criteria = state.decision.criteria;
        const alternatives = state.decision.alternatives;
        const weights = state.decision.weights;
        const evaluations = state.decision.evaluations;
        
        logger.log('RESULTS', 'Data for recalculation', {
            criteriaCount: criteria.length,
            alternativesCount: alternatives.length,
            weights,
            evaluations
        });
        
        // Validate data
        if (!criteria || !alternatives || !weights || !evaluations ||
            criteria.length === 0 || alternatives.length === 0 ||
            Object.keys(weights).length === 0 || Object.keys(evaluations).length === 0) {
            logger.error('RESULTS', 'Missing data for recalculation');
            showError('Missing data for recalculation.');
            return null;
        }
        
        // Normalize weights to sum to 1 for calculation purposes
        const totalWeight = criteria.reduce((sum, criterion) => {
            return sum + (weights[criterion] || 0);
        }, 0);
        
        const normalizedWeights = {};
        criteria.forEach(criterion => {
            // Convert percentage weights (0-100) to decimal (0-1)
            normalizedWeights[criterion] = totalWeight > 0 ? 
                (weights[criterion] || 0) / totalWeight : 
                1 / criteria.length; // Equal weights if total is 0
        });
        
        logger.log('RESULTS', 'Normalized weights for calculation', normalizedWeights);
        
        // Recalculate scores
        const results = {};
        
        // For each alternative
        alternatives.forEach(alternative => {
            if (!evaluations[alternative]) {
                logger.error('RESULTS', `Missing evaluations for alternative: ${alternative}`);
                results[alternative] = 0;
                return;
            }
            
            let totalScore = 0;
            
            // For each criterion
            criteria.forEach(criterion => {
                const normalizedWeight = normalizedWeights[criterion];
                const evaluation = evaluations[alternative][criterion] || 0;
                
                // Weighted score for this criterion
                const weightedScore = normalizedWeight * evaluation;
                totalScore += weightedScore;
                
                logger.log('RESULTS', `${alternative}/${criterion}: ${evaluation} * ${normalizedWeight.toFixed(4)} = ${weightedScore.toFixed(4)}`);
            });
            
            // Store final score
            results[alternative] = totalScore;
            logger.log('RESULTS', `Total score for ${alternative}: ${totalScore}`);
        });
        
        // Rank alternatives
        const sortedAlternatives = Object.entries(results)
            .sort(([, scoreA], [, scoreB]) => {
                return scoreB - scoreA;
            })
            .map(([alt], index) => ({ alt, rank: index + 1 }));
            
        // Add rank to results
        sortedAlternatives.forEach(({ alt, rank }) => {
            results[alt] = {
                score: results[alt],
                rank: rank
            };
        });
        
        // Update state
        state.decision.results = results;
        
        // Update UI
        displayResults(results);
        
        logger.log('RESULTS', 'Results recalculated successfully', results);
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
        const sortedAlternatives = Object.entries(results)
            .sort(([, scoreA], [, scoreB]) => {
                const a = typeof scoreA === 'object' ? scoreA.score : scoreA;
                const b = typeof scoreB === 'object' ? scoreB.score : scoreB;
                return parseFloat(b) - parseFloat(a);
            })
            .map(([alt], index) => ({ alt, rank: index + 1 }));
            
        // Add rank to results
        sortedAlternatives.forEach(({ alt, rank }) => {
            results[alt] = {
                score: results[alt],
                rank: rank
            };
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
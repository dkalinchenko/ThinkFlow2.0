const express = require('express');
const router = express.Router();
const decisionService = require('../services/decisionService');
const { ensureAuthenticated } = require('../middleware/auth');
const logger = require('../utils/logger');
const { Decision } = require('../models');

// Get all decisions for the logged-in user
router.get('/my-decisions', ensureAuthenticated, async (req, res) => {
    try {
        const decisions = await decisionService.getUserDecisions(req.user.id);
        res.render('my-decisions', {
            title: 'My Decisions',
            decisions,
            isAuthenticated: req.isAuthenticated(),
            user: req.user
        });
    } catch (error) {
        logger.error('DECISIONS_ROUTE', 'Error fetching user decisions', error);
        req.flash('error_msg', 'Error fetching your decisions');
        res.redirect('/dashboard');
    }
});

// View a specific decision
router.get('/decision/:id', async (req, res) => {
    try {
        const decisionId = req.params.id;
        let decision = await decisionService.getDecision(decisionId);
        
        // Check if decision exists
        if (!decision) {
            req.flash('error_msg', 'Decision not found');
            return res.redirect(req.isAuthenticated() ? '/my-decisions' : '/');
        }
        
        // Check if the user has access to this decision
        const isAuthenticated = req.isAuthenticated();
        const canAccessDecision = 
            // Authenticated user who owns the decision
            (isAuthenticated && decision.userId === req.user.id) ||
            // Guest user with a decision that has no userId (guest decision)
            (!isAuthenticated && !decision.userId);
        
        if (!canAccessDecision) {
            req.flash('error_msg', 'You do not have permission to view this decision');
            return res.redirect(isAuthenticated ? '/my-decisions' : '/');
        }
        
        // If the decision has participants, recalculate the results to ensure we have the most up-to-date information
        if (decision.participants && 
           ((decision.participants.weights && decision.participants.weights.some(p => p.completed)) || 
            (decision.participants.evaluations && decision.participants.evaluations.some(p => p.completed)))) {
            
            logger.debug('DECISION_VIEW', 'Recalculating results with participant data', {
                decisionId: decision.id,
                weightParticipants: decision.participants.weights?.filter(p => p.completed).length || 0,
                evalParticipants: decision.participants.evaluations?.filter(p => p.completed).length || 0
            });
            
            // Calculate enhanced results with participant data
            const enhancedResults = decisionService.calculateResultsWithParticipants(decision);
            
            // Update the decision object for the view (no need to save to database)
            decision.results = enhancedResults;
        }
        
        res.render('view-decision', {
            title: decision.name,
            decision,
            isAuthenticated: req.isAuthenticated(),
            user: req.user
        });
    } catch (error) {
        logger.error('DECISIONS_ROUTE', 'Error viewing decision', error);
        req.flash('error_msg', 'Error viewing decision');
        res.redirect(req.isAuthenticated() ? '/my-decisions' : '/');
    }
});

// Save a decision to user account
router.post('/save-to-account', ensureAuthenticated, async (req, res) => {
    try {
        const { decisionId, name, criteria, weights, alternatives, evaluations, results } = req.body;
        
        if (!decisionId) {
            return res.status(400).json({
                success: false,
                error: 'Decision ID is required'
            });
        }
        
        const decisionData = {
            name,
            criteria,
            weights,
            alternatives,
            evaluations,
            results
        };
        
        await decisionService.saveDecisionToUser(decisionId, req.user.id, decisionData);
        
        res.json({
            success: true,
            message: 'Decision saved to your account successfully'
        });
    } catch (error) {
        logger.error('DECISIONS_ROUTE', 'Error saving decision to account', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Error saving decision to your account'
        });
    }
});

// Delete a decision
router.post('/decision/:id/delete', ensureAuthenticated, async (req, res) => {
    try {
        const decision = await decisionService.getDecision(req.params.id);
        
        // Check if decision exists and belongs to user
        if (!decision || decision.userId !== req.user.id) {
            req.flash('error_msg', 'Decision not found or access denied');
            return res.redirect('/my-decisions');
        }
        
        await decisionService.deleteDecision(req.params.id);
        req.flash('success_msg', 'Decision deleted successfully');
        res.redirect('/my-decisions');
    } catch (error) {
        logger.error('DECISIONS_ROUTE', 'Error deleting decision', error);
        req.flash('error_msg', 'Error deleting decision');
        res.redirect('/my-decisions');
    }
});

// Collaboration setup
router.get('/collaboration-setup/:decisionId/:type', async (req, res) => {
    try {
        const { decisionId, type } = req.params;
        
        if (!decisionId || !type) {
            return res.status(400).json({ success: false, error: 'Missing required parameters' });
        }
        
        if (type !== 'criteria-weights' && type !== 'alternatives-evaluation') {
            return res.status(400).json({ success: false, error: 'Invalid collaboration type' });
        }
        
        // Get the decision from the database
        const decision = await Decision.findByPk(decisionId);
        
        if (!decision) {
            return res.status(404).json({ success: false, error: 'Decision not found' });
        }
        
        // Generate a unique participant ID for initial participant
        const initialParticipantId = 'p_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        
        // Get any existing participants for this collaboration type
        let participants = [];
        
        if (decision.participants) {
            if (type === 'criteria-weights' && decision.participants.weights) {
                participants = decision.participants.weights;
            } else if (type === 'alternatives-evaluation' && decision.participants.evaluations) {
                participants = decision.participants.evaluations;
            }
        }
        
        // Generate a unique collaboration link
        const host = req.get('host');
        const protocol = req.protocol;
        const collaborationLink = `${protocol}://${host}/participant/${decisionId}/${type}/${initialParticipantId}`;
        
        const collaborationType = type === 'criteria-weights' ? 'Criteria Weights' : 'Alternative Evaluation';
        
        // Render the collaboration setup page
        return res.render('collaboration-invite', {
            decisionId,
            decisionName: decision.name,
            collaborationType,
            collaborationLink,
            initialParticipantId,
            participants
        });
    } catch (error) {
        console.error('Error setting up collaboration:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Save participants
router.post('/save-participants', async (req, res) => {
    try {
        const { decisionId, collaborationType, participants } = req.body;
        
        if (!decisionId || !collaborationType || !Array.isArray(participants)) {
            return res.status(400).json({ success: false, error: 'Missing required parameters' });
        }
        
        // Get the decision from the database
        const decision = await Decision.findByPk(decisionId);
        
        if (!decision) {
            return res.status(404).json({ success: false, error: 'Decision not found' });
        }
        
        // Update the decision's participants
        const currentParticipants = decision.participants || { weights: [], evaluations: [] };
        
        console.log('[DEBUG][SAVE_PARTICIPANTS]', 'Saving participants for decision:', {
            decisionId,
            collaborationType,
            participantCount: participants.length
        });
        
        // Determine which type of participants we're updating
        const participantType = collaborationType === 'Criteria Weights' || collaborationType === 'criteria-weights' 
            ? 'weights' 
            : 'evaluations';
        
        // For each participant being saved, check if they have submitted completed data
        // If so, preserve their data and completed status, just update the name
        const updatedParticipants = participants.map(participant => {
            // Find if this participant has already submitted data (has completed status)
            const existingParticipant = currentParticipants[participantType].find(
                p => p.id === participant.id && p.completed === true
            );
            
            if (existingParticipant) {
                console.log('[DEBUG][SAVE_PARTICIPANTS]', 'Preserving completed data for participant:', {
                    id: participant.id,
                    originalName: existingParticipant.name,
                    newName: participant.name
                });
                
                // Return the existing participant with potentially updated name
                return {
                    ...existingParticipant,
                    name: participant.name || existingParticipant.name
                };
            } else {
                // This is a participant that hasn't submitted data yet or is new
                console.log('[DEBUG][SAVE_PARTICIPANTS]', 'Saving new/updated participant:', {
                    id: participant.id,
                    name: participant.name
                });
                
                return {
                    id: participant.id,
                    name: participant.name,
                    data: {},
                    completed: false
                };
            }
        });
        
        // Update the participants list
        currentParticipants[participantType] = updatedParticipants;
        
        // Save participants to the database
        await decision.update({ participants: currentParticipants });
        
        console.log('[DEBUG][SAVE_PARTICIPANTS]', 'Successfully saved participants');
        return res.json({ success: true });
    } catch (error) {
        console.error('Error saving participants:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Participant page
router.get('/participant/:decisionId/:type/:participantId', async (req, res) => {
    try {
        const { decisionId, type, participantId } = req.params;
        
        if (!decisionId || !type || !participantId) {
            return res.status(400).json({ success: false, error: 'Missing required parameters' });
        }
        
        if (type !== 'criteria-weights' && type !== 'alternatives-evaluation') {
            return res.status(400).json({ success: false, error: 'Invalid collaboration type' });
        }
        
        // Get the decision from the database
        const decision = await Decision.findByPk(decisionId);
        
        if (!decision) {
            return res.status(404).json({ success: false, error: 'Decision not found' });
        }
        
        // Get the participant from the decision's participants
        const decisionParticipants = decision.participants || { weights: [], evaluations: [] };
        const participantsList = type === 'criteria-weights' ? decisionParticipants.weights : decisionParticipants.evaluations;
        
        const foundParticipant = participantsList.find(p => p.id === participantId);
        let participantName = 'Participant';
        let participantData = {};
        
        if (foundParticipant) {
            participantName = foundParticipant.name || 'Participant';
            participantData = foundParticipant.data || {};
        }
        
        /* Commented out since Participant model is disabled
        // Get the participant from the database
        let participant = await Participant.findByPk(participantId);
        
        // If participant doesn't exist yet, create a placeholder for the view
        let participantName = 'Participant';
        if (participant) {
            participantName = participant.name;
        } else {
            // Check if participant is in the decision's participants list
            const decisionParticipants = decision.participants || { weights: [], evaluations: [] };
            const participantsList = type === 'criteria-weights' ? decisionParticipants.weights : decisionParticipants.evaluations;
            
            const foundParticipant = participantsList.find(p => p.id === participantId);
            if (foundParticipant) {
                participantName = foundParticipant.name;
            }
        }
        */
        
        // Prepare data for the view
        const collaborationType = type;
        const decisionName = decision.name;
        const criteria = decision.criteria;
        let weights = decision.weights;
        const alternatives = decision.alternatives;
        
        // Get evaluations if the participant has already submitted some
        let evaluations = {};
        if (type === 'criteria-weights') {
            // For criteria weights, the data contains the weights
            weights = participantData;
        } else if (type === 'alternatives-evaluation') {
            // For alternative evaluation, the data contains the evaluations
            evaluations = participantData;
        }
        
        /* Commented out since Participant model is disabled
        // Get evaluations if the participant has already submitted some
        let evaluations = {};
        if (participant && participant.data) {
            if (type === 'criteria-weights') {
                // For criteria weights, the data contains the weights
                weights = participant.data;
            } else if (type === 'alternatives-evaluation') {
                // For alternative evaluation, the data contains the evaluations
                evaluations = participant.data;
            }
        }
        */
        
        // Render the participant input page
        return res.render('participant-input', {
            decisionId,
            decisionName,
            participantId,
            participantName,
            collaborationType,
            criteria,
            weights,
            alternatives,
            evaluations
        });
    } catch (error) {
        console.error('Error rendering participant page:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Submit participant input
router.post('/submit-participant-input', async (req, res) => {
    try {
        const { participantId, decisionId, collaborationType, weights, evaluations, participantName } = req.body;
        
        if (!participantId || !decisionId || !collaborationType) {
            return res.status(400).json({ success: false, error: 'Missing required parameters' });
        }
        
        // Get the decision from the database
        const decision = await Decision.findByPk(decisionId);
        
        if (!decision) {
            return res.status(404).json({ success: false, error: 'Decision not found' });
        }
        
        // Store the input directly in the decision for now
        // since Participant model is disabled
        const currentParticipants = decision.participants || { weights: [], evaluations: [] };
        
        // Log debug information about participant names
        console.log('[DEBUG][PARTICIPANT_NAME]', 'Processing participant input with name:', {
            participantId,
            providedName: participantName
        });
        
        // First, check if this participant already exists in any of the lists
        // to retrieve their name if no new name is provided
        let existingParticipantName = null;
        
        // Check weights participants
        const existingWeightParticipant = currentParticipants.weights.find(p => p.id === participantId);
        if (existingWeightParticipant && existingWeightParticipant.name) {
            existingParticipantName = existingWeightParticipant.name;
            console.log('[DEBUG][PARTICIPANT_NAME]', 'Found existing weight participant name:', existingParticipantName);
        }
        
        // Check evaluations participants if not found in weights
        if (!existingParticipantName) {
            const existingEvalParticipant = currentParticipants.evaluations.find(p => p.id === participantId);
            if (existingEvalParticipant && existingEvalParticipant.name) {
                existingParticipantName = existingEvalParticipant.name;
                console.log('[DEBUG][PARTICIPANT_NAME]', 'Found existing evaluation participant name:', existingParticipantName);
            }
        }
        
        // Determine the final name for this participant
        // Priority: 1. Provided name, 2. Existing name, 3. Default
        const finalParticipantName = participantName || existingParticipantName || 'Anonymous Participant';
        console.log('[DEBUG][PARTICIPANT_NAME]', 'Final participant name:', finalParticipantName);
        
        if (collaborationType === 'criteria-weights') {
            // Find the participant in the weights array
            let participantIndex = currentParticipants.weights.findIndex(p => p.id === participantId);
            
            if (participantIndex >= 0) {
                // Update existing participant
                console.log('[DEBUG][PARTICIPANT_NAME]', 'Updating existing weights participant at index:', participantIndex);
                currentParticipants.weights[participantIndex].data = weights;
                currentParticipants.weights[participantIndex].completed = true;
                currentParticipants.weights[participantIndex].name = finalParticipantName;
            } else {
                // Create new participant
                console.log('[DEBUG][PARTICIPANT_NAME]', 'Creating new weights participant');
                currentParticipants.weights.push({
                    id: participantId,
                    name: finalParticipantName,
                    data: weights,
                    completed: true
                });
            }
        } else if (collaborationType === 'alternatives-evaluation') {
            // Find the participant in the evaluations array
            let participantIndex = currentParticipants.evaluations.findIndex(p => p.id === participantId);
            
            if (participantIndex >= 0) {
                // Update existing participant
                console.log('[DEBUG][PARTICIPANT_NAME]', 'Updating existing evaluations participant at index:', participantIndex);
                currentParticipants.evaluations[participantIndex].data = evaluations;
                currentParticipants.evaluations[participantIndex].completed = true;
                currentParticipants.evaluations[participantIndex].name = finalParticipantName;
            } else {
                // Create new participant
                console.log('[DEBUG][PARTICIPANT_NAME]', 'Creating new evaluations participant');
                currentParticipants.evaluations.push({
                    id: participantId,
                    name: finalParticipantName,
                    data: evaluations,
                    completed: true
                });
            }
        }
        
        // Also update the participant in the saved participants list to keep names consistent
        for (const type of ['weights', 'evaluations']) {
            const savedParticipantIndex = currentParticipants[type].findIndex(
                p => p.id === participantId && (!p.completed || p.completed === false)
            );
            
            if (savedParticipantIndex >= 0) {
                console.log('[DEBUG][PARTICIPANT_NAME]', `Updating saved participant name in ${type} list at index:`, savedParticipantIndex);
                currentParticipants[type][savedParticipantIndex].name = finalParticipantName;
            }
        }
        
        // Save the updated participants data
        await decision.update({ participants: currentParticipants });
        
        console.log('[DEBUG][PARTICIPANT_NAME]', 'Successfully saved participant with name:', finalParticipantName);
        return res.json({ success: true });
    } catch (error) {
        console.error('Error submitting participant input:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Public view of a decision (no authentication required)
router.get('/public-decision/:id', async (req, res) => {
    try {
        let decision = await decisionService.getDecision(req.params.id);
        
        // Check if decision exists
        if (!decision) {
            return res.status(404).render('error', {
                message: 'Decision not found',
                error: { status: 404 },
                isAuthenticated: req.isAuthenticated(),
                user: req.user
            });
        }
        
        // If the decision has participants, recalculate the results
        if (decision.participants && 
           ((decision.participants.weights && decision.participants.weights.some(p => p.completed)) || 
            (decision.participants.evaluations && decision.participants.evaluations.some(p => p.completed)))) {
            
            logger.debug('PUBLIC_DECISION_VIEW', 'Recalculating results with participant data', {
                decisionId: decision.id,
                weightParticipants: decision.participants.weights?.filter(p => p.completed).length || 0,
                evalParticipants: decision.participants.evaluations?.filter(p => p.completed).length || 0
            });
            
            // Calculate enhanced results with participant data
            const enhancedResults = decisionService.calculateResultsWithParticipants(decision);
            
            // Update the decision object for the view
            decision.results = enhancedResults;
        }
        
        res.render('view-decision', {
            title: decision.name,
            decision,
            isAuthenticated: req.isAuthenticated(),
            user: req.user,
            isPublicView: true
        });
    } catch (error) {
        logger.error('DECISIONS_ROUTE', 'Error viewing public decision', error);
        res.status(500).render('error', {
            message: 'Error viewing decision',
            error: { status: 500 },
            isAuthenticated: req.isAuthenticated(),
            user: req.user
        });
    }
});

// Participant Comparison Dashboard
router.get('/participant-dashboard/:decisionId', async (req, res) => {
    try {
        const { decisionId } = req.params;
        
        console.log('[DEBUG][PARTICIPANT_DASHBOARD] Starting dashboard render for decision', decisionId);
        
        if (!decisionId) {
            console.log('[ERROR][PARTICIPANT_DASHBOARD] Missing decision ID');
            return res.status(400).render('error', { 
                message: 'Missing decision ID',
                error: { status: 400, stack: '' } 
            });
        }
        
        // Get the decision from the database
        const decision = await Decision.findByPk(decisionId);
        
        if (!decision) {
            console.log('[ERROR][PARTICIPANT_DASHBOARD] Decision not found:', decisionId);
            return res.status(404).render('error', { 
                message: 'Decision not found',
                error: { status: 404, stack: '' } 
            });
        }
        
        // Remove the strict authentication check - only authenticated users should be able 
        // to view the participant dashboard, regardless of who created the decision
        // This allows anyone with the decision ID to view the comparison dashboard
        
        // Extract participant data
        const weightParticipants = decision.participants?.weights?.filter(p => p.completed) || [];
        const evalParticipants = decision.participants?.evaluations?.filter(p => p.completed) || [];
        
        // Check if we have any participant data to display
        if (weightParticipants.length === 0 && evalParticipants.length === 0) {
            console.log('[WARN][PARTICIPANT_DASHBOARD] No completed participants found for decision:', decisionId);
            return res.render('participant-dashboard', {
                title: `Participant Comparison - ${decision.name || 'Unnamed Decision'}`,
                dashboardData: JSON.stringify({
                    decision: {
                        id: decision.id,
                        name: decision.name || 'Unnamed Decision',
                        criteria: decision.criteria || [],
                        alternatives: decision.alternatives || [],
                        weights: decision.weights || {},
                        evaluations: decision.evaluations || {},
                        results: decision.results || {}
                    },
                    weightParticipants: [],
                    evalParticipants: []
                }),
                dashboardDataJSON: JSON.stringify({
                    decision: {
                        id: decision.id,
                        name: decision.name || 'Unnamed Decision',
                        criteria: decision.criteria || [],
                        alternatives: decision.alternatives || [],
                        weights: decision.weights || {},
                        evaluations: decision.evaluations || {},
                        results: decision.results || {}
                    },
                    weightParticipants: [],
                    evalParticipants: []
                }).replace(/'/g, "\\'").replace(/"/g, '\\"')
            });
        }
        
        // Sanitize and prepare data for the dashboard
        const dashboardData = {
            decision: {
                id: decision.id,
                name: decision.name || 'Unnamed Decision',
                criteria: decision.criteria || [],
                alternatives: decision.alternatives || [],
                weights: decision.weights || {},
                evaluations: decision.evaluations || {},
                results: decision.results || {}
            },
            weightParticipants,
            evalParticipants
        };
        
        // Log debugging information
        console.log('[DEBUG][PARTICIPANT_DASHBOARD]', 'Preparing dashboard data', {
            decisionId,
            weightParticipantCount: weightParticipants.length,
            evalParticipantCount: evalParticipants.length,
            hasCriteria: (decision.criteria || []).length > 0,
            hasAlternatives: (decision.alternatives || []).length > 0
        });
        
        // Safely stringify the dashboard data
        let dashboardDataString;
        try {
            dashboardDataString = JSON.stringify(dashboardData);
            // Check if the string is valid JSON by trying to parse it
            JSON.parse(dashboardDataString);
        } catch (jsonError) {
            console.error('[ERROR][PARTICIPANT_DASHBOARD] Error stringifying dashboard data:', jsonError);
            return res.status(500).render('error', { 
                message: 'Error processing dashboard data',
                error: {
                    status: 500,
                    stack: process.env.NODE_ENV === 'development' ? jsonError.stack : ''
                }
            });
        }
        
        // Convert the data to a safe string for embedding in JavaScript
        const dashboardDataJSON = dashboardDataString.replace(/'/g, "\\'").replace(/"/g, '\\"');
        
        // Render the participant dashboard view
        return res.render('participant-dashboard', {
            title: `Participant Comparison - ${decision.name || 'Unnamed Decision'}`,
            dashboardData: dashboardDataString,
            dashboardDataJSON: dashboardDataJSON
        });
    } catch (error) {
        console.error('[ERROR][PARTICIPANT_DASHBOARD] Error rendering dashboard:', error);
        return res.status(500).render('error', { 
            message: 'An error occurred while rendering the participant dashboard',
            error: {
                status: 500,
                stack: process.env.NODE_ENV === 'development' ? error.stack : ''
            }
        });
    }
});

// Handle participant input submission
router.post('/participant-submit/:decisionId/:participantId', async (req, res) => {
    try {
        const { decisionId, participantId } = req.params;
        const { type, name, email, participantData } = req.body;
        
        if (!decisionId || !participantId || !type || !participantData) {
            return res.status(400).json({ success: false, message: 'Missing required parameters' });
        }
        
        // Get the decision
        const decision = await decisionService.getDecision(decisionId);
        if (!decision) {
            return res.status(404).json({ success: false, message: 'Decision not found' });
        }
        
        // Initialize participants object if it doesn't exist
        if (!decision.participants) {
            decision.participants = { weights: [], evaluations: [] };
        }
        
        // Determine participant list based on type
        const participantsList = type === 'weights' ? 'weights' : 'evaluations';
        if (!Array.isArray(decision.participants[participantsList])) {
            decision.participants[participantsList] = [];
        }
        
        // Find existing participant or create new one
        let participantIndex = decision.participants[participantsList].findIndex(p => p.id === participantId);
        
        if (participantIndex >= 0) {
            // Update existing participant
            decision.participants[participantsList][participantIndex] = {
                ...decision.participants[participantsList][participantIndex],
                name: name || decision.participants[participantsList][participantIndex].name,
                email: email || decision.participants[participantsList][participantIndex].email,
                data: participantData,
                completed: true,
                submittedAt: new Date().toISOString()
            };
        } else {
            // Add new participant
            decision.participants[participantsList].push({
                id: participantId,
                name: name || 'Anonymous',
                email: email || '',
                data: participantData,
                completed: true,
                submittedAt: new Date().toISOString()
            });
        }
        
        // Calculate updated results with participant data
        const updatedResults = decisionService.calculateResultsWithParticipants(decision);
        
        // Update the decision with new participants and results
        await decisionService.updateDecision(decisionId, {
            participants: decision.participants,
            results: updatedResults
        });
        
        return res.json({ 
            success: true, 
            message: 'Thank you for your input! Your contribution has been recorded.'
        });
    } catch (error) {
        logger.error('PARTICIPANT_SUBMIT', 'Error submitting participant data', error);
        return res.status(500).json({ 
            success: false, 
            message: 'An error occurred while submitting your input. Please try again.'
        });
    }
});

module.exports = router; 
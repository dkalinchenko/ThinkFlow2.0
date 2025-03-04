const express = require('express');
const router = express.Router();
const decisionService = require('../services/decisionService');
const { ensureAuthenticated } = require('../middleware/auth');
const logger = require('../utils/logger');

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
router.get('/decision/:id', ensureAuthenticated, async (req, res) => {
    try {
        const decision = await decisionService.getDecision(req.params.id);
        
        // Check if decision exists and belongs to user
        if (!decision || decision.userId !== req.user.id) {
            req.flash('error_msg', 'Decision not found or access denied');
            return res.redirect('/my-decisions');
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
        res.redirect('/my-decisions');
    }
});

// Save a decision to user account
router.post('/save-to-account', ensureAuthenticated, async (req, res) => {
    try {
        const { decisionId } = req.body;
        
        if (!decisionId) {
            return res.status(400).json({
                success: false,
                error: 'Decision ID is required'
            });
        }
        
        await decisionService.saveDecisionToUser(decisionId, req.user.id);
        
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

module.exports = router; 
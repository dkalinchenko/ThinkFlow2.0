const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const decisionController = require('../controllers/decision.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get all decisions
router.get('/', decisionController.getAllDecisions);

// Create a new decision
router.post(
  '/',
  [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('description').optional(),
    body('criteria').optional().isArray(),
    body('criteria.*.name').optional().not().isEmpty().withMessage('Criteria name is required'),
    body('criteria.*.weight').optional().isFloat({ min: 0 }).withMessage('Criteria weight must be a positive number'),
    body('alternatives').optional().isArray(),
    body('alternatives.*.name').optional().not().isEmpty().withMessage('Alternative name is required')
  ],
  decisionController.createDecision
);

// Get a specific decision
router.get('/:id', decisionController.getDecision);

// Update a decision
router.put(
  '/:id',
  [
    body('title').optional().not().isEmpty().withMessage('Title cannot be empty'),
    body('description').optional(),
    body('status').optional().isIn(['active', 'archived']).withMessage('Status must be either active or archived')
  ],
  decisionController.updateDecision
);

// Delete a decision
router.delete('/:id', decisionController.deleteDecision);

// Get decision results
router.get('/:id/results', decisionController.getDecisionResults);

module.exports = router; 
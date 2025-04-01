const { Decision, Criteria, Alternative, Invitation, User, Score } = require('../models');
const { validationResult } = require('express-validator');

// Get all decisions (created by or shared with the user)
const getAllDecisions = async (req, res) => {
  try {
    // Get decisions created by the user
    const createdDecisions = await Decision.findAll({
      where: { created_by: req.user.id },
      attributes: ['id', 'title', 'description', 'status', 'created_at'],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    // Get decisions shared with the user through invitations
    const acceptedInvitations = await Invitation.findAll({
      where: { invitee_email: req.user.email, status: 'accepted' },
      include: [
        {
          model: Decision,
          as: 'decision',
          attributes: ['id', 'title', 'description', 'status', 'created_at'],
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    // Extract decisions from invitations
    const sharedDecisions = acceptedInvitations.map(invitation => invitation.decision);

    // Combine both sets of decisions
    const decisions = [...createdDecisions, ...sharedDecisions];

    return res.status(200).json({
      success: true,
      count: decisions.length,
      data: decisions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create a new decision
const createDecision = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { title, description, criteria = [], alternatives = [] } = req.body;

  try {
    // Create the decision
    const decision = await Decision.create({
      title,
      description,
      created_by: req.user.id
    });

    // Create criteria if provided
    if (criteria.length > 0) {
      const criteriaRecords = await Promise.all(
        criteria.map(criterion => Criteria.create({
          decision_id: decision.id,
          name: criterion.name,
          weight: criterion.weight || 1.0
        }))
      );
    }

    // Create alternatives if provided
    if (alternatives.length > 0) {
      const alternativeRecords = await Promise.all(
        alternatives.map(alternative => Alternative.create({
          decision_id: decision.id,
          name: alternative.name,
          description: alternative.description
        }))
      );
    }

    // Get the full decision with associated data
    const fullDecision = await Decision.findByPk(decision.id, {
      include: [
        {
          model: Criteria,
          as: 'criteria'
        },
        {
          model: Alternative,
          as: 'alternatives'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    return res.status(201).json({
      success: true,
      data: fullDecision
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get a specific decision
const getDecision = async (req, res) => {
  try {
    const decision = await Decision.findByPk(req.params.id, {
      include: [
        {
          model: Criteria,
          as: 'criteria'
        },
        {
          model: Alternative,
          as: 'alternatives'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Score,
          as: 'scores',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }
          ]
        },
        {
          model: Invitation,
          as: 'invitations',
          attributes: ['id', 'invitee_email', 'status', 'sent_at']
        }
      ]
    });

    if (!decision) {
      return res.status(404).json({
        success: false,
        message: 'Decision not found'
      });
    }

    // Check if user has access to this decision
    if (decision.created_by !== req.user.id) {
      // Check if user was invited
      const invitation = await Invitation.findOne({
        where: {
          decision_id: decision.id,
          invitee_email: req.user.email,
          status: 'accepted'
        }
      });

      if (!invitation) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this decision'
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: decision
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update a decision
const updateDecision = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { title, description, status } = req.body;
    
    const decision = await Decision.findByPk(req.params.id);
    
    if (!decision) {
      return res.status(404).json({
        success: false,
        message: 'Decision not found'
      });
    }
    
    // Check if user is the creator
    if (decision.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator can update a decision'
      });
    }
    
    // Update decision fields
    if (title !== undefined) decision.title = title;
    if (description !== undefined) decision.description = description;
    if (status !== undefined && ['active', 'archived'].includes(status)) {
      decision.status = status;
    }
    
    await decision.save();
    
    return res.status(200).json({
      success: true,
      data: decision
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete a decision
const deleteDecision = async (req, res) => {
  try {
    const decision = await Decision.findByPk(req.params.id);
    
    if (!decision) {
      return res.status(404).json({
        success: false,
        message: 'Decision not found'
      });
    }
    
    // Check if user is the creator
    if (decision.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the creator can delete a decision'
      });
    }

    // Delete the decision (this will cascade to all related records due to foreign key constraints)
    await decision.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Decision deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get decision results (weighted scores)
const getDecisionResults = async (req, res) => {
  try {
    const decision = await Decision.findByPk(req.params.id, {
      include: [
        {
          model: Criteria,
          as: 'criteria'
        },
        {
          model: Alternative,
          as: 'alternatives'
        },
        {
          model: Score,
          as: 'scores',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });
    
    if (!decision) {
      return res.status(404).json({
        success: false,
        message: 'Decision not found'
      });
    }
    
    // Check if user has access to this decision
    if (decision.created_by !== req.user.id) {
      // Check if user was invited
      const invitation = await Invitation.findOne({
        where: {
          decision_id: decision.id,
          invitee_email: req.user.email,
          status: 'accepted'
        }
      });
      
      if (!invitation) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this decision'
        });
      }
    }
    
    // Calculate weighted scores
    const results = decision.alternatives.map(alternative => {
      // Initialize weighted score sum and criteria weight sum
      let weightedScoreSum = 0;
      let criteriaWeightSum = 0;
      
      // Get all criteria
      decision.criteria.forEach(criterion => {
        // Find scores for this alternative and criterion
        const criterionScores = decision.scores.filter(
          score => 
            score.alternative_id === alternative.id && 
            score.criteria_id === criterion.id
        );
        
        // Calculate average score for this criterion
        const scoreCount = criterionScores.length;
        if (scoreCount > 0) {
          const scoreSum = criterionScores.reduce(
            (sum, score) => sum + parseFloat(score.score), 
            0
          );
          const averageScore = scoreSum / scoreCount;
          
          // Apply criterion weight to average score
          weightedScoreSum += averageScore * parseFloat(criterion.weight);
          criteriaWeightSum += parseFloat(criterion.weight);
        }
      });
      
      // Calculate final weighted score
      const finalScore = criteriaWeightSum > 0 
        ? weightedScoreSum / criteriaWeightSum 
        : 0;
      
      return {
        alternative_id: alternative.id,
        alternative_name: alternative.name,
        weighted_score: parseFloat(finalScore.toFixed(2)),
        score_count: decision.scores.filter(
          score => score.alternative_id === alternative.id
        ).length
      };
    });
    
    // Sort results by weighted score in descending order
    results.sort((a, b) => b.weighted_score - a.weighted_score);
    
    return res.status(200).json({
      success: true,
      data: {
        decision_id: decision.id,
        decision_title: decision.title,
        results
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllDecisions,
  createDecision,
  getDecision,
  updateDecision,
  deleteDecision,
  getDecisionResults
}; 
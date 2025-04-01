const { Decision } = require('../models');
const logger = require('../utils/logger');

/**
 * Decision Service - Handles all operations related to decisions
 */
class DecisionService {
  /**
   * Get a decision by ID
   * @param {string} id - Decision ID
   * @returns {Promise<Object|null>} - Decision object or null if not found
   */
  async getDecision(id) {
    try {
      return await Decision.findByPk(id);
    } catch (error) {
      logger.error('DECISION', 'Error getting decision', error);
      throw error;
    }
  }

  /**
   * Get all decisions for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - Array of decisions
   */
  async getUserDecisions(userId) {
    try {
      return await Decision.findAll({
        where: { userId },
        order: [['updatedAt', 'DESC']]
      });
    } catch (error) {
      logger.error('DECISION', 'Error getting user decisions', error);
      throw error;
    }
  }

  /**
   * Create a new decision
   * @param {Object} data - Decision data
   * @param {number} userId - User ID (optional)
   * @returns {Promise<Object>} - Created decision
   */
  async createDecision(data, userId = null) {
    try {
      return await Decision.create({
        id: data.id,
        name: data.name,
        criteria: [],
        weights: {},
        alternatives: [],
        evaluations: {},
        results: {},
        userId: userId
      });
    } catch (error) {
      logger.error('DECISION', 'Error creating decision', error);
      throw error;
    }
  }

  /**
   * Update a decision
   * @param {string} id - Decision ID
   * @param {Object} data - Updated decision data
   * @returns {Promise<Object|null>} - Updated decision or null if not found
   */
  async updateDecision(id, data) {
    try {
      const decision = await Decision.findByPk(id);
      if (!decision) return null;

      // Update only provided fields 
      const updateableFields = ['name', 'criteria', 'weights', 'alternatives', 
                              'evaluations', 'results', 'userId', 'participants'];
      
      for (const field of updateableFields) {
        if (data[field] !== undefined) {
          decision[field] = data[field];
        }
      }

      await decision.save();
      return decision;
    } catch (error) {
      logger.error('DECISION', 'Error updating decision', error);
      throw error;
    }
  }

  /**
   * Delete a decision
   * @param {string} id - Decision ID
   * @returns {Promise<boolean>} - True if deleted, false if not found
   */
  async deleteDecision(id) {
    try {
      const decision = await Decision.findByPk(id);
      if (!decision) return false;
      
      await decision.destroy();
      return true;
    } catch (error) {
      logger.error('DECISION', 'Error deleting decision', error);
      throw error;
    }
  }

  /**
   * Process decision data for a specific step
   * @param {number} step - Current step number
   * @param {Object} data - Step data
   * @param {Object} currentState - Current decision state
   * @param {number} userId - User ID (optional)
   * @returns {Promise<Object>} - Updated decision
   */
  async processStep(step, data, currentState, userId = null) {
    try {
      let decision = await this.getDecision(data.id);
      
      // Handle step 1 (creating or resetting a decision)
      if (step === 1) {
        const newDecisionData = {
          name: data.name,
          criteria: [],
          weights: {},
          alternatives: [],
          evaluations: {},
          results: {},
          userId: userId
        };
        
        return decision 
          ? await this.updateDecision(data.id, newDecisionData)
          : await this.createDecision(data, userId);
      }

      // For other steps, create a decision if it doesn't exist
      if (!decision) {
        if (!currentState) {
          throw new Error('Decision not found and no current state provided');
        }
        
        decision = await Decision.create({
          id: data.id,
          name: currentState.name || 'Untitled Decision',
          criteria: currentState.criteria || [],
          weights: currentState.weights || {},
          alternatives: currentState.alternatives || [],
          evaluations: currentState.evaluations || {},
          results: currentState.results || {},
          userId: userId
        });
        
        logger.debug('PROCESS_STEP', `Created new decision for step ${step}`, { 
          id: data.id, step, userId
        });
      }

      // Process step-specific data
      switch (step) {
        case 2: // Criteria
          this.validateCriteria(data.criteria);
          
          // Update criteria and reset dependent fields
          decision = await this.updateDecision(data.id, {
            criteria: data.criteria,
            weights: this.initializeWeights(data.criteria),
            evaluations: {} // Reset evaluations
          });
          break;
          
        case 3: // Weights
          this.validateWeights(data.weights, decision.criteria);
          
          // Update weights
          decision = await this.updateDecision(data.id, {
            weights: data.weights
          });
          break;
          
        case 4: // Alternatives
          this.validateAlternatives(data.alternatives);
          
          // Update alternatives and reset evaluations
          decision = await this.updateDecision(data.id, {
            alternatives: data.alternatives,
            evaluations: this.initializeEvaluations(data.alternatives, decision.criteria)
          });
          break;
          
        case 5: // Evaluations
          try {
            // Make sure we have the required data
            if (!Array.isArray(decision.criteria) || decision.criteria.length === 0) {
              throw new Error('Decision has no criteria defined');
            }
            
            if (!Array.isArray(decision.alternatives) || decision.alternatives.length === 0) {
              throw new Error('Decision has no alternatives defined');
            }
            
            if (!data.evaluations || typeof data.evaluations !== 'object') {
              throw new Error('Invalid evaluations data format');
            }
            
            // Validate all evaluations
            this.validateEvaluations(data.evaluations, decision.alternatives, decision.criteria);
            
            // Calculate results
            const results = this.calculateResults(
              decision.criteria,
              decision.weights,
              data.evaluations
            );
            
            // Update decision
            decision = await this.updateDecision(data.id, {
              evaluations: data.evaluations,
              results
            });
          } catch (error) {
            logger.error('DECISION_STEP5', 'Error processing evaluations', { 
              error: error.message,
              decisionId: data.id,
              hasAlternatives: Array.isArray(decision.alternatives),
              alternativesCount: Array.isArray(decision.alternatives) ? decision.alternatives.length : 0,
              hasCriteria: Array.isArray(decision.criteria),
              criteriaCount: Array.isArray(decision.criteria) ? decision.criteria.length : 0
            });
            throw error;
          }
          break;
      }

      return decision;
    } catch (error) {
      logger.error(`Error processing step ${step}:`, error);
      throw error;
    }
  }
  
  /**
   * Validate criteria data
   */
  validateCriteria(criteria) {
    if (!Array.isArray(criteria) || criteria.length === 0) {
      throw new Error('Please enter at least one criterion');
    }
    
    // Check for duplicate criteria
    const uniqueCriteria = new Set(criteria);
    if (uniqueCriteria.size !== criteria.length) {
      throw new Error('Duplicate criteria are not allowed');
    }
  }
  
  /**
   * Initialize weights for criteria
   */
  initializeWeights(criteria) {
    const weights = {};
    const equalWeight = criteria.length > 0 ? 100 / criteria.length : 0;
    
    criteria.forEach(criterion => {
      if (criterion && criterion.trim()) {
        weights[criterion] = equalWeight;
      }
    });
    
    return weights;
  }
  
  /**
   * Validate weights data
   */
  validateWeights(weights, criteria) {
    if (!weights || typeof weights !== 'object') {
      throw new Error('Invalid weights format');
    }
    
    // Ensure all criteria have weights
    criteria.forEach(criterion => {
      if (weights[criterion] === undefined) {
        throw new Error(`Missing weight for criterion: ${criterion}`);
      }
    });
    
    // Check total is approximately 100%
    const total = Object.values(weights).reduce((sum, w) => sum + Number(w), 0);
    if (Math.abs(total - 100) > 1) { // Allow small rounding errors
      throw new Error(`Weights must total 100% (current total: ${total.toFixed(1)}%)`);
    }
  }
  
  /**
   * Validate alternatives data
   */
  validateAlternatives(alternatives) {
    if (!Array.isArray(alternatives) || alternatives.length === 0) {
      throw new Error('Please enter at least one alternative');
    }
    
    // Check for duplicate alternatives
    const uniqueAlternatives = new Set(alternatives);
    if (uniqueAlternatives.size !== alternatives.length) {
      throw new Error('Duplicate alternatives are not allowed');
    }
  }
  
  /**
   * Initialize empty evaluation structure
   */
  initializeEvaluations(alternatives, criteria) {
    const evaluations = {};
    
    alternatives.forEach(alt => {
      evaluations[alt] = {};
      criteria.forEach(criterion => {
        evaluations[alt][criterion] = 0; // Default score
      });
    });
    
    return evaluations;
  }
  
  /**
   * Validate evaluations data
   */
  validateEvaluations(evaluations, alternatives, criteria) {
    if (!evaluations || typeof evaluations !== 'object') {
      throw new Error('Invalid evaluations format');
    }
    
    // Ensure alternatives is an array
    if (!Array.isArray(alternatives)) {
      throw new Error('Alternatives must be an array');
    }
    
    // Check that all alternatives have evaluations
    const missingAlternatives = alternatives.filter(
      alt => !Object.keys(evaluations).includes(alt)
    );
    
    if (missingAlternatives.length > 0) {
      throw new Error(`Missing evaluations for alternatives: ${missingAlternatives.join(', ')}`);
    }
    
    // Check that all criteria are evaluated for each alternative
    const missingEvaluations = [];
    alternatives.forEach(alt => {
      criteria.forEach(criterion => {
        if (evaluations[alt][criterion] === undefined) {
          missingEvaluations.push(`${alt}/${criterion}`);
        }
      });
    });
    
    if (missingEvaluations.length > 0) {
      throw new Error(`Missing evaluation values for: ${missingEvaluations.join(', ')}`);
    }
  }

  /**
   * Calculate decision results
   * @param {Array} criteria - List of criteria
   * @param {Object} weights - Criteria weights as percentages (0-100%)
   * @param {Object} evaluations - Alternative evaluations
   * @returns {Object} - Results for each alternative
   */
  calculateResults(criteria, weights, evaluations) {
    this.validateInputsForCalculation(criteria, weights, evaluations);
    
    const results = {};
    const alternatives = Object.keys(evaluations);
    
    // Calculate scores for each alternative
    alternatives.forEach(alternative => {
      const breakdown = {};
      let totalScore = 0;
      
      criteria.forEach(criterion => {
        const weight = Number(weights[criterion] || 0) / 100; // Convert percentage to decimal
        const score = Number(evaluations[alternative][criterion] || 0);
        const weightedScore = weight * score;
        
        breakdown[criterion] = parseFloat(weightedScore.toFixed(2));
        totalScore += weightedScore;
      });
      
      results[alternative] = {
        score: parseFloat(totalScore.toFixed(2)),
        breakdown
      };
    });
    
    // Calculate ranks
    const sortedAlternatives = alternatives.sort((a, b) => 
      results[b].score - results[a].score
    );
    
    sortedAlternatives.forEach((alternative, index) => {
      results[alternative].rank = index + 1;
    });
    
    return results;
  }
  
  /**
   * Validate inputs for calculation
   */
  validateInputsForCalculation(criteria, weights, evaluations) {
    // Check criteria
    if (!criteria) {
      throw new Error('Missing criteria');
    }
    
    if (!Array.isArray(criteria)) {
      throw new Error('Criteria must be an array');
    }
    
    if (criteria.length === 0) {
      throw new Error('Criteria array is empty');
    }
    
    // Check weights
    if (!weights) {
      throw new Error('Missing weights');
    }
    
    if (typeof weights !== 'object' || Array.isArray(weights)) {
      throw new Error('Weights must be an object');
    }
    
    // Check evaluations
    if (!evaluations) {
      throw new Error('Missing evaluations');
    }
    
    if (typeof evaluations !== 'object' || Array.isArray(evaluations)) {
      throw new Error('Evaluations must be an object');
    }
    
    if (Object.keys(evaluations).length === 0) {
      throw new Error('No alternatives in evaluations');
    }
    
    // Ensure all criteria have weights
    criteria.forEach(criterion => {
      if (weights[criterion] === undefined) {
        throw new Error(`Missing weight for criterion: ${criterion}`);
      }
    });
  }

  /**
   * Calculate results with participant data
   * @param {Object} decision - Decision with participant data
   * @returns {Object} - Results calculated with participant input
   */
  calculateResultsWithParticipants(decision) {
    const participants = decision.participants || { weights: [], evaluations: [] };
    
    // Get completed participants
    const weightParticipants = (participants.weights || []).filter(p => p.completed);
    const evalParticipants = (participants.evaluations || []).filter(p => p.completed);
    
    // If no participants have completed, use owner's data only
    if (weightParticipants.length === 0 && evalParticipants.length === 0) {
      return this.calculateResults(decision.criteria, decision.weights, decision.evaluations);
    }
    
    // Combine weights from all participants
    const combinedWeights = weightParticipants.length > 0 
      ? this.combineParticipantWeights(decision.weights, weightParticipants)
      : decision.weights;
    
    // Combine evaluations from all participants  
    const combinedEvaluations = evalParticipants.length > 0
      ? this.combineParticipantEvaluations(decision.evaluations, evalParticipants)
      : decision.evaluations;
    
    // Calculate results with combined data
    return this.calculateResults(decision.criteria, combinedWeights, combinedEvaluations);
  }
  
  /**
   * Combine weights from participants
   */
  combineParticipantWeights(ownerWeights, participants) {
    const combined = { ...ownerWeights };
    const participantCount = participants.length + 1; // +1 for owner
    
    Object.keys(combined).forEach(criterion => {
      let totalWeight = Number(combined[criterion] || 0);
      
      participants.forEach(participant => {
        totalWeight += Number(participant.data[criterion] || 0);
      });
      
      // Average weights across all participants
      combined[criterion] = totalWeight / participantCount;
    });
    
    // Normalize weights to ensure they sum to 100%
    const totalWeight = Object.values(combined).reduce((sum, w) => sum + Number(w), 0);
    
    if (totalWeight > 0) {
      Object.keys(combined).forEach(criterion => {
        combined[criterion] = (combined[criterion] / totalWeight) * 100;
      });
    }
    
    return combined;
  }
  
  /**
   * Combine evaluations from participants
   */
  combineParticipantEvaluations(ownerEvals, participants) {
    const combined = {};
    const alternatives = Object.keys(ownerEvals);
    
    alternatives.forEach(alternative => {
      combined[alternative] = { ...ownerEvals[alternative] };
      const criteria = Object.keys(combined[alternative]);
      
      criteria.forEach(criterion => {
        let totalScore = Number(combined[alternative][criterion] || 0);
        let participantCount = 1; // Start with 1 for owner
        
        participants.forEach(participant => {
          const participantScore = participant.data[alternative]?.[criterion];
          if (participantScore !== undefined) {
            totalScore += Number(participantScore);
            participantCount++;
          }
        });
        
        // Average scores across all participants
        combined[alternative][criterion] = totalScore / participantCount;
      });
    });
    
    return combined;
  }

  /**
   * Save a completed decision to a user's account
   * @param {string} decisionId - Decision ID
   * @param {number} userId - User ID
   * @param {Object} decisionData - Decision data
   * @returns {Promise<Object>} - Updated decision
   */
  async saveDecisionToUser(decisionId, userId, decisionData) {
    try {
      let decision = await this.getDecision(decisionId);
      
      if (decision) {
        // Update decision with new data
        const updatedData = {
          ...decisionData,
          userId: userId
        };
        
        // Save the updated decision
        decision = await this.updateDecision(decisionId, updatedData);
        
        // If there are participants, recalculate the results with participant data
        if (decision.participants && 
            ((decision.participants.weights && decision.participants.weights.length > 0) || 
            (decision.participants.evaluations && decision.participants.evaluations.length > 0))) {
          
          logger.debug('SAVE_DECISION', 'Recalculating results with participant data', {
            decisionId,
            weightParticipants: decision.participants.weights?.length || 0,
            evalParticipants: decision.participants.evaluations?.length || 0
          });
          
          // Calculate results incorporating participant data
          const enhancedResults = this.calculateResultsWithParticipants(decision);
          
          // Update the decision with new results and updated weights
          decision = await this.updateDecision(decisionId, {
            results: enhancedResults
          });
        }
      } else {
        // Create new decision
        decision = await Decision.create({
          id: decisionId,
          ...decisionData,
          userId: userId
        });
      }
      
      return decision;
    } catch (error) {
      logger.error('DECISION', 'Error saving decision to user', error);
      throw error;
    }
  }
}

module.exports = new DecisionService();
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
      const decision = await Decision.findByPk(id);
      return decision;
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
      const decisions = await Decision.findAll({
        where: { userId },
        order: [['updatedAt', 'DESC']]
      });
      return decisions;
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
      const decision = await Decision.create({
        id: data.id,
        name: data.name,
        criteria: [],
        weights: {},
        alternatives: [],
        evaluations: {},
        results: {},
        userId: userId
      });
      return decision;
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
      if (!decision) {
        return null;
      }

      // Update only the fields that are provided
      if (data.name !== undefined) decision.name = data.name;
      if (data.criteria !== undefined) decision.criteria = data.criteria;
      if (data.weights !== undefined) decision.weights = data.weights;
      if (data.alternatives !== undefined) decision.alternatives = data.alternatives;
      if (data.evaluations !== undefined) decision.evaluations = data.evaluations;
      if (data.results !== undefined) decision.results = data.results;
      if (data.userId !== undefined) decision.userId = data.userId;

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
      if (!decision) {
        return false;
      }
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
      
      // For step 1, create a new decision
      if (step === 1) {
        if (decision) {
          // If decision already exists, update it
          decision = await this.updateDecision(data.id, {
            name: data.name,
            criteria: [],
            weights: {},
            alternatives: [],
            evaluations: {},
            results: {},
            userId: userId
          });
        } else {
          // Create new decision
          decision = await this.createDecision(data, userId);
        }
        return decision;
      }

      // For other steps, ensure decision exists
      if (!decision) {
        throw new Error('Decision not found');
      }

      // Process step data
      switch (step) {
        case 2: // Criteria
          if (!Array.isArray(data.criteria) || data.criteria.length === 0) {
            throw new Error('Please enter at least one criterion');
          }
          
          // Update criteria and reset dependent fields
          decision = await this.updateDecision(data.id, {
            criteria: data.criteria,
            weights: {}, // Reset weights
            evaluations: {} // Reset evaluations
          });
          
          // Initialize weights
          const weights = {};
          data.criteria.forEach(criterion => {
            weights[criterion] = 5; // Default to middle value
          });
          
          decision = await this.updateDecision(data.id, { weights });
          break;

        case 3: // Weights
          if (!data.weights || typeof data.weights !== 'object') {
            throw new Error('Invalid weights format');
          }
          
          // Validate weights
          const criteria = decision.criteria;
          const invalidCriteria = Object.keys(data.weights).filter(
            criterion => !criteria.includes(criterion)
          );
          
          if (invalidCriteria.length > 0) {
            throw new Error('Invalid criteria in weights');
          }
          
          // Validate weight values
          const newWeights = {};
          for (const criterion of criteria) {
            const weight = Number(data.weights[criterion]);
            if (isNaN(weight) || weight < 1 || weight > 10) {
              throw new Error(`Invalid weight value for ${criterion}. Must be between 1 and 10.`);
            }
            newWeights[criterion] = weight;
          }
          
          decision = await this.updateDecision(data.id, { weights: newWeights });
          break;

        case 4: // Alternatives
          if (!Array.isArray(data.alternatives) || data.alternatives.length === 0) {
            throw new Error('Please enter at least one alternative');
          }
          
          // Update alternatives and initialize evaluations
          decision = await this.updateDecision(data.id, { alternatives: data.alternatives });
          
          // Initialize evaluations
          const evaluations = {};
          data.alternatives.forEach(alternative => {
            evaluations[alternative] = {};
            decision.criteria.forEach(criterion => {
              evaluations[alternative][criterion] = 5; // Default to middle value
            });
          });
          
          decision = await this.updateDecision(data.id, { evaluations });
          break;

        case 5: // Evaluations
          if (!data.evaluations || typeof data.evaluations !== 'object') {
            // Try using client state if available
            if (currentState && currentState.evaluations) {
              logger.debug('STEP5', 'Using evaluations from client state');
              data.evaluations = currentState.evaluations;
            } else {
              logger.error('STEP5', 'Invalid evaluations format', data.evaluations);
              throw new Error('Invalid evaluations format');
            }
          }
          
          // Validate evaluations
          const alternatives = decision.alternatives;
          if (!Array.isArray(alternatives) || alternatives.length === 0) {
            logger.error('STEP5', 'No alternatives found in decision', decision.alternatives);
            throw new Error('No alternatives defined for this decision');
          }
          
          // Check that all defined alternatives have evaluations
          logger.debug('STEP5', 'Validating evaluations for alternatives', {
            definedAlternatives: alternatives,
            providedEvaluationKeys: Object.keys(data.evaluations || {})
          });
          
          const invalidAlternatives = Object.keys(data.evaluations || {}).filter(
            alt => !alternatives.includes(alt)
          );
          
          if (invalidAlternatives.length > 0) {
            logger.error('STEP5', 'Invalid alternatives in evaluations', invalidAlternatives);
            throw new Error('Invalid alternatives in evaluations');
          }
          
          // Check that all alternatives in the decision have evaluations
          const missingAlternatives = alternatives.filter(
            alt => !Object.keys(data.evaluations || {}).includes(alt)
          );
          
          if (missingAlternatives.length > 0) {
            logger.error('STEP5', 'Missing evaluations for alternatives', missingAlternatives);
            throw new Error(`Missing evaluations for alternatives: ${missingAlternatives.join(', ')}`);
          }
          
          // Check that all criteria are evaluated for each alternative
          const decisionCriteria = decision.criteria;
          if (!Array.isArray(decisionCriteria) || decisionCriteria.length === 0) {
            logger.error('STEP5', 'No criteria found in decision', decision.criteria);
            throw new Error('No criteria defined for this decision');
          }
          
          let missingEvaluations = [];
          alternatives.forEach(alt => {
            decisionCriteria.forEach(criterion => {
              if (data.evaluations[alt][criterion] === undefined) {
                missingEvaluations.push(`${alt}/${criterion}`);
              }
            });
          });
          
          if (missingEvaluations.length > 0) {
            logger.error('STEP5', 'Missing evaluation values', missingEvaluations);
            throw new Error(`Missing evaluation values for: ${missingEvaluations.join(', ')}`);
          }
          
          // Calculate results
          logger.debug('STEP5', 'Calculating results with:', {
            criteriaCount: decisionCriteria.length,
            alternativesCount: alternatives.length,
            evaluationsCount: Object.keys(data.evaluations).length
          });
          
          try {
            const results = this.calculateResults(
              decisionCriteria,
              decision.weights,
              data.evaluations
            );
            
            // Update evaluations and results
            decision = await this.updateDecision(data.id, {
              evaluations: data.evaluations,
              results
            });
          } catch (error) {
            logger.error('STEP5', 'Error calculating results', error);
            throw new Error(`Error calculating results: ${error.message}`);
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
   * Calculate decision results
   * @param {Array} criteria - List of criteria
   * @param {Object} weights - Criteria weights
   * @param {Object} evaluations - Alternative evaluations
   * @returns {Object} - Results for each alternative
   */
  calculateResults(criteria, weights, evaluations) {
    try {
      logger.debug('CALCULATION', 'Starting calculation with:', {
        criteriaCount: criteria?.length,
        weightsKeys: Object.keys(weights || {}),
        evaluationsKeys: Object.keys(evaluations || {})
      });
      
      // Validate all required data exists
      if (!Array.isArray(criteria) || criteria.length === 0) {
        logger.error('CALCULATION', 'Invalid criteria array', criteria);
        throw new Error('Missing or invalid criteria');
      }
      
      if (!weights || typeof weights !== 'object') {
        logger.error('CALCULATION', 'Invalid weights object', weights);
        throw new Error('Missing or invalid weights');
      }
      
      if (!evaluations || typeof evaluations !== 'object') {
        logger.error('CALCULATION', 'Invalid evaluations object', evaluations);
        throw new Error('Missing or invalid evaluations');
      }
      
      const results = {};
      
      // Calculate total weights
      const totalWeight = Object.values(weights).reduce(
        (sum, weight) => sum + Number(weight), 0
      );
      
      logger.debug('CALCULATION', `Total weight calculated: ${totalWeight}`);
      
      if (totalWeight === 0) {
        logger.error('CALCULATION', 'Total weight is zero');
        throw new Error('Total weight cannot be zero');
      }
      
      // Calculate scores for each alternative
      Object.keys(evaluations).forEach(alternative => {
        let totalWeightedScore = 0;
        
        logger.debug('CALCULATION', `Processing alternative: ${alternative}`);
        
        criteria.forEach(criterion => {
          const weight = Number(weights[criterion] || 0);
          const normalizedWeight = weight / totalWeight;
          
          // Validate that the evaluation exists for this criterion
          if (!evaluations[alternative] || evaluations[alternative][criterion] === undefined) {
            logger.error('CALCULATION', `Missing evaluation for ${alternative}/${criterion}`);
            throw new Error(`Missing evaluation for ${alternative}/${criterion}`);
          }
          
          const score = Number(evaluations[alternative][criterion]);
          if (isNaN(score)) {
            logger.error('CALCULATION', `Invalid score for ${alternative}/${criterion}: ${evaluations[alternative][criterion]}`);
            throw new Error(`Invalid score for ${alternative}/${criterion}`);
          }
          
          const weightedScore = normalizedWeight * score;
          logger.debug('CALCULATION', `  ${criterion}: weight=${weight}, norm=${normalizedWeight.toFixed(2)}, score=${score}, weighted=${weightedScore.toFixed(2)}`);
          
          totalWeightedScore += weightedScore;
        });
        
        results[alternative] = Math.round(totalWeightedScore * 100) / 100;
        logger.debug('CALCULATION', `Final score for ${alternative}: ${results[alternative]}`);
      });
      
      logger.debug('CALCULATION', 'Calculation completed successfully', results);
      return results;
    } catch (error) {
      logger.error('CALCULATION', 'Error in calculation', error);
      throw error;
    }
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
        // Update existing decision
        decision = await this.updateDecision(decisionId, {
          ...decisionData,
          userId: userId
        });
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
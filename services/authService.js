const bcrypt = require('bcryptjs');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Authentication Service - Handles user registration, login, and management
 */
class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Registration result with success flag and user data or error
   */
  async registerUser(userData) {
    try {
      // Check if username already exists
      const existingUsername = await User.findOne({ where: { username: userData.username } });
      if (existingUsername) {
        return {
          success: false,
          error: 'Username already exists'
        };
      }

      // Check if email already exists
      const existingEmail = await User.findOne({ where: { email: userData.email } });
      if (existingEmail) {
        return {
          success: false,
          error: 'Email already exists'
        };
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create user
      const user = await User.create({
        username: userData.username,
        email: userData.email,
        password: hashedPassword
      });

      // Return user without password
      const userResponse = user.toJSON();
      delete userResponse.password;
      
      logger.debug('AUTH', 'User registered successfully', { userId: user.id });
      return {
        success: true,
        user: userResponse
      };
    } catch (error) {
      logger.error('AUTH', 'Error registering user', error);
      return {
        success: false,
        error: error.message || 'Error registering user'
      };
    }
  }

  /**
   * Authenticate a user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object>} - Authentication result with success flag and user or error
   */
  async authenticateUser(username, password) {
    try {
      // Find user by username
      const user = await User.findOne({ where: { username } });
      if (!user) {
        logger.debug('AUTH', 'Authentication failed - User not found', { username });
        return { 
          success: false, 
          error: 'Invalid username or password' 
        };
      }

      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        logger.debug('AUTH', 'Authentication failed - Password mismatch', { username });
        return { 
          success: false, 
          error: 'Invalid username or password' 
        };
      }

      // Return user without password
      const userResponse = user.toJSON();
      delete userResponse.password;
      
      logger.debug('AUTH', 'Authentication successful', { userId: user.id });
      return { 
        success: true, 
        user: userResponse 
      };
    } catch (error) {
      logger.error('AUTH', 'Error authenticating user', error);
      return {
        success: false,
        error: 'Authentication error occurred'
      };
    }
  }

  /**
   * Get user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  async getUserById(id) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        logger.debug('AUTH', 'User not found by ID', { userId: id });
        return null;
      }

      // Return user without password
      const userResponse = user.toJSON();
      delete userResponse.password;
      
      return userResponse;
    } catch (error) {
      logger.error('AUTH', 'Error getting user by ID', error);
      return null;
    }
  }

  /**
   * Update user profile
   * @param {number} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} - Update result with success flag and user data or error
   */
  async updateUser(id, userData) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        logger.debug('AUTH', 'User not found for update', { userId: id });
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Update fields
      if (userData.email) user.email = userData.email;
      if (userData.username) user.username = userData.username;
      
      // Update password if provided
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(userData.password, salt);
      }

      await user.save();

      // Return user without password
      const userResponse = user.toJSON();
      delete userResponse.password;
      
      logger.debug('AUTH', 'User updated successfully', { userId: id });
      return {
        success: true,
        user: userResponse
      };
    } catch (error) {
      logger.error('AUTH', 'Error updating user', error);
      return {
        success: false,
        error: error.message || 'Error updating user'
      };
    }
  }
}

module.exports = new AuthService(); 
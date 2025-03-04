const LocalStrategy = require('passport-local').Strategy;
const authService = require('../services/authService');
const logger = require('../utils/logger');

/**
 * Passport configuration
 * @param {Object} passport - Passport instance
 */
module.exports = function(passport) {
  logger.info('PASSPORT', 'Configuring Passport authentication');

  // Local strategy
  passport.use(
    new LocalStrategy({ 
      usernameField: 'username',
      passwordField: 'password'
    }, async (username, password, done) => {
      try {
        logger.debug('PASSPORT', 'Attempting authentication', { username });
        
        // Authenticate user
        const result = await authService.authenticateUser(username, password);
        
        if (result.success) {
          logger.info('PASSPORT', 'User authenticated successfully', { 
            userId: result.user.id,
            username: result.user.username 
          });
          return done(null, result.user);
        } else {
          logger.debug('PASSPORT', 'Authentication failed', { 
            username,
            reason: result.error 
          });
          return done(null, false, { message: result.error });
        }
      } catch (error) {
        logger.error('PASSPORT', 'Error in authentication', {
          error: error.message,
          stack: error.stack,
          username
        });
        return done(error);
      }
    })
  );

  // Serialize user for session
  passport.serializeUser((user, done) => {
    logger.debug('PASSPORT', 'Serializing user', { 
      userId: user.id,
      username: user.username 
    });
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      logger.debug('PASSPORT', 'Deserializing user', { userId: id });
      const user = await authService.getUserById(id);
      
      if (user) {
        logger.debug('PASSPORT', 'User deserialized successfully', { 
          userId: user.id,
          username: user.username 
        });
        done(null, user);
      } else {
        logger.warn('PASSPORT', 'Failed to deserialize user - not found', { userId: id });
        done(null, null);
      }
    } catch (error) {
      logger.error('PASSPORT', 'Error deserializing user', {
        error: error.message,
        stack: error.stack,
        userId: id
      });
      done(error, null);
    }
  });
}; 
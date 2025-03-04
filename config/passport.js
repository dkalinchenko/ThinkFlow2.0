const LocalStrategy = require('passport-local').Strategy;
const authService = require('../services/authService');
const logger = require('../utils/logger');

/**
 * Passport configuration
 * @param {Object} passport - Passport instance
 */
module.exports = function(passport) {
  // Local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Authenticate user
        const result = await authService.authenticateUser(username, password);
        
        if (result.success) {
          logger.debug('PASSPORT', 'User authenticated successfully', { userId: result.user.id });
          return done(null, result.user);
        } else {
          logger.debug('PASSPORT', 'Authentication failed', { reason: result.error });
          return done(null, false, { message: result.error });
        }
      } catch (error) {
        logger.error('PASSPORT', 'Error in authentication', error);
        return done(error);
      }
    })
  );

  // Serialize user for session
  passport.serializeUser((user, done) => {
    logger.debug('PASSPORT', 'Serializing user', { userId: user.id });
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      logger.debug('PASSPORT', 'Deserializing user', { userId: id });
      const user = await authService.getUserById(id);
      done(null, user);
    } catch (error) {
      logger.error('PASSPORT', 'Error deserializing user', error);
      done(error, null);
    }
  });
}; 
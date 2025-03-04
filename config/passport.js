const LocalStrategy = require('passport-local').Strategy;
const authService = require('../services/authService');

/**
 * Passport configuration
 * @param {Object} passport - Passport instance
 */
module.exports = function(passport) {
  // Local strategy
  passport.use(
    new LocalStrategy({ 
      usernameField: 'username',
      passwordField: 'password'
    }, async (username, password, done) => {
      try {
        // Authenticate user
        const result = await authService.authenticateUser(username, password);
        
        if (result.success) {
          return done(null, result.user);
        } else {
          return done(null, false, { message: result.error });
        }
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await authService.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}; 
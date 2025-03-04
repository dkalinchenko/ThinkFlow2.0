/**
 * Authentication middleware
 */

// Ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to access this resource');
  res.redirect('/login');
};

// Ensure user is not authenticated (for login/register pages)
const ensureGuest = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/dashboard');
};

// Check if user is authenticated (for conditional rendering)
const checkAuthenticated = (req, res, next) => {
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.user = req.user;
  next();
};

module.exports = {
  ensureAuthenticated,
  ensureGuest,
  checkAuthenticated
}; 
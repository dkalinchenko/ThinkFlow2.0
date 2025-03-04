/**
 * Authentication middleware
 */

const logger = require('../utils/logger');

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
  // List of public routes that don't require authentication
  const publicRoutes = [
    '/', 
    '/login', 
    '/register', 
    '/health',
    '/save-step'  // Allow form submissions
  ];
  
  // Allow access to public routes, static files, and CSS/JS resources
  if (
    publicRoutes.includes(req.path) || 
    req.path.startsWith('/public') ||
    req.path.startsWith('/css') ||
    req.path.startsWith('/js') ||
    req.path.endsWith('.js') ||
    req.path.endsWith('.css')
  ) {
    logger.debug('AUTH', 'Allowing public access to', req.path);
    return next();
  }

  // Check if user is authenticated for protected routes
  if (req.isAuthenticated()) {
    logger.debug('AUTH', 'User authenticated, allowing access to', req.path);
    return next();
  }

  // If trying to access protected route while not authenticated
  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    // For AJAX requests
    logger.debug('AUTH', 'Unauthenticated AJAX request to', req.path);
    return res.status(401).json({ 
      success: false, 
      error: 'Please log in to continue' 
    });
  }

  // For regular requests
  logger.debug('AUTH', 'Redirecting unauthenticated request to login', req.path);
  req.flash('error_msg', 'Please log in to access this resource');
  res.redirect('/login');
};

module.exports = {
  ensureAuthenticated,
  ensureGuest,
  checkAuthenticated
}; 
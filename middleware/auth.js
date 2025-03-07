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
  const publicRoutes = ['/', '/login', '/register', '/blog', '/faq', '/blog/*', '/app', '/save-step', '/health', '/contact'];

  // Check if the current route matches any of the public routes
  const isPublicRoute = publicRoutes.some(route => {
    if (route.endsWith('*')) {
      return req.path.startsWith(route.slice(0, -1));
    }
    return route === req.path;
  });

  if (isPublicRoute) {
    return next();
  }

  // For non-public routes, check authentication
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/login');
};

module.exports = {
  ensureAuthenticated,
  ensureGuest,
  checkAuthenticated
}; 
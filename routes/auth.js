const express = require('express');
const passport = require('passport');
const router = express.Router();
const authService = require('../services/authService');
const { ensureAuthenticated, ensureGuest } = require('../middleware/auth');
const logger = require('../utils/logger');

// Register page
router.get('/register', ensureGuest, (req, res) => {
  res.render('register', {
    title: 'Register',
    isAuthenticated: false
  });
});

// Register user
router.post('/register', ensureGuest, async (req, res) => {
  try {
    logger.debug('REQUEST', 'Register request', { body: req.body });
    const { username, email, password, password2 } = req.body;
    
    // Check for validation errors
    let errors = [];
    
    // Required fields
    if (!username || !email || !password || !password2) {
      errors.push({ msg: 'Please fill in all fields' });
    }
    
    // Check passwords match
    if (password !== password2) {
      errors.push({ msg: 'Passwords do not match' });
    }
    
    // Check password length
    if (password.length < 6) {
      errors.push({ msg: 'Password should be at least 6 characters' });
    }
    
    // If there are errors, re-render the form
    if (errors.length > 0) {
      return res.render('register', {
        title: 'Register',
        errors,
        username,
        email,
        isAuthenticated: false
      });
    }
    
    // Register user
    const result = await authService.registerUser({ username, email, password });
    
    if (result.success) {
      req.flash('success_msg', 'You are now registered and can log in');
      res.redirect('/login');
    } else {
      errors.push({ msg: result.error });
      res.render('register', {
        title: 'Register',
        errors,
        username,
        email,
        isAuthenticated: false
      });
    }
  } catch (error) {
    logger.error('AUTH_ROUTE', 'Registration error', error);
    req.flash('error_msg', 'An error occurred during registration');
    res.redirect('/register');
  }
});

// Login page
router.get('/login', ensureGuest, (req, res) => {
  res.render('login', {
    title: 'Login',
    isAuthenticated: false
  });
});

// Login user
router.post('/login', ensureGuest, (req, res, next) => {
  logger.debug('REQUEST', 'Login request', { body: req.body });
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
});

// Logout user
router.get('/logout', ensureAuthenticated, (req, res, next) => {
  req.logout(function(err) {
    if (err) { 
      logger.error('AUTH_ROUTE', 'Logout error', err);
      return next(err); 
    }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/login');
  });
});

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard', {
    title: 'Dashboard',
    user: req.user,
    isAuthenticated: true
  });
});

module.exports = router; 
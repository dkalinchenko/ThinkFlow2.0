const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const { initDatabase } = require('./models');
const decisionService = require('./services/decisionService');
const logger = require('./utils/logger');
const { checkAuthenticated } = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 3333;

// Passport config
require('./config/passport')(passport);

// Initialize database
initDatabase().catch(err => {
  logger.error('APP', 'Failed to initialize database', err);
  process.exit(1);
});

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Add timeout middleware to prevent hanging requests
app.use((req, res, next) => {
  // Set timeout for all requests to 30 seconds
  req.setTimeout(30000, () => {
    logger.warn('SERVER', 'Request timeout', { 
      method: req.method, 
      url: req.url, 
      ip: req.ip 
    });
    res.status(503).send('Request timeout. Please try again.');
  });
  next();
});

// Express session
app.use(session({
  secret: 'decision_matrix_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  },
  // Auto-remove expired sessions to prevent memory leaks
  rolling: true
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Check if user is authenticated
app.use(checkAuthenticated);

// Add request logging
app.use((req, res, next) => {
    if (req.method === 'POST') {
    logger.debug('REQUEST', `${req.method} ${req.url}`, { body: req.body });
    }
    next();
});

// View engine setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// Routes
app.get('/', async (req, res) => {
  logger.info('ROUTE', 'Rendering index page');
    res.render('index', { 
    title: 'New Decision',
        step: 1,
        decisions: {},
        currentId: null
    });
});

app.post('/save-step', async (req, res) => {
    try {
        const { step, data, currentState } = req.body;
    const userId = req.isAuthenticated() ? req.user.id : null;
    
    logger.debug('SAVE_STEP', `Processing step ${step}`, { data, currentState });
        
        if (!data || !data.id) {
      logger.warn('SAVE_STEP', 'Invalid data format', data);
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid data format' 
            });
        }

    // Process step using service
    const decision = await decisionService.processStep(step, data, currentState, userId);
    logger.debug('SAVE_STEP', 'Step processed successfully', decision);

    // Prepare response
    const response = { 
            success: true,
            nextStep: step + 1,
            currentId: data.id,
            criteria: decision.criteria,
            weights: decision.weights,
      alternatives: decision.alternatives,
      isAuthenticated: req.isAuthenticated()
    };

    // Add results for step 5
    if (step === 5) {
      response.results = decision.results;
    }

    logger.debug('SAVE_STEP', 'Sending response', response);
    res.json(response);
    } catch (error) {
    logger.error('SAVE_STEP', 'Error processing request', error);
    res.status(400).json({ 
            success: false, 
      error: error.message || 'An error occurred' 
        });
    }
});

// Auth routes
app.use('/', require('./routes/auth'));

// Decision routes
app.use('/', require('./routes/decisions'));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('SERVER', 'Unhandled error', err);
  res.status(500).send('Something went wrong. Please try again.');
});

// Start server with explicit error handling
app.listen(port, () => {
    console.log(`[INFO][SERVER] Decision Matrix App is running on port ${port}`);
    console.log(`[INFO][SERVER] http://localhost:${port}`);
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
    logger.error('SERVER', `Port ${port} is already in use`);
    } else {
    logger.error('SERVER', 'Server error', error);
    }
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('SERVER', 'Uncaught exception', error);
  // Give the server a chance to send any pending responses before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('SERVER', 'Unhandled promise rejection', { reason });
  // Keep the process running but log the error
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SERVER', 'Shutting down gracefully');
    server.close(() => {
    logger.info('SERVER', 'Server closed');
        process.exit(0);
    });
});

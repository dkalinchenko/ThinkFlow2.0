const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const { initDatabase, sequelize } = require('./models');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const decisionService = require('./services/decisionService');
const logger = require('./utils/logger');
const { checkAuthenticated } = require('./middleware/auth');

// Import routes
const websiteRoutes = require('./routes/website');
const authRoutes = require('./routes/auth');
const decisionsRoutes = require('./routes/decisions');

const app = express();
const port = process.env.PORT || 3333;

// Passport config
require('./config/passport')(passport);

// Initialize database
initDatabase()
  .then(() => {
    logger.info('DATABASE', 'Successfully initialized database');
  })
  .catch(err => {
    logger.error('DATABASE', 'Failed to initialize database', err);
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

// Session store
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'Sessions'
});

// Express session with enhanced security
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'decision_matrix_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  },
  name: 'sessionId', // Custom name for better security
  rolling: true, // Refresh session with each request
  proxy: process.env.NODE_ENV === 'production' // Trust the reverse proxy in production
}));

// Create session table
sessionStore.sync();

// Move passport and flash middleware AFTER session middleware
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  res.locals.isAuthenticated = req.isAuthenticated();
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

// Set default layout
app.set('view options', { layout: 'layout' });

// Website routes (should be before the app routes)
app.use('/', websiteRoutes);

// Redirect /app to the decision matrix tool
app.get('/app', (req, res) => {
    res.render('index', { 
        layout: 'layout',
        title: 'New Decision',
        step: 1,
        decisions: {},
        currentId: null,
        isAuthenticated: req.isAuthenticated(),
        user: req.user
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.get('/', async (req, res) => {
    logger.info('ROUTE', 'Rendering index page');
    res.render('index', { 
        title: 'New Decision',
        step: 1,
        decisions: {},
        currentId: null,
        isAuthenticated: req.isAuthenticated(),
        user: req.user
    });
});

app.post('/save-step', async (req, res) => {
    try {
        const { step, data, currentState } = req.body;
        const userId = req.isAuthenticated() ? req.user.id : null;
        
        logger.debug('SAVE_STEP', `Processing step ${step}`, { 
            data, 
            currentState,
            isAuthenticated: req.isAuthenticated()
        });
        
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

        // For step 5 (evaluation completed), save the decision and redirect to view-decision
        if (step === 5) {
            try {
                // Create a complete decision object with all necessary data
                const completeDecision = {
                    id: data.id,
                    name: decision.name,
                    criteria: decision.criteria,
                    weights: decision.weights,
                    alternatives: decision.alternatives,
                    evaluations: decision.evaluations,
                    results: decision.results
                };

                // Save the decision to the database (for both guests and logged-in users)
                const savedDecision = await decisionService.saveDecisionToUser(data.id, userId, completeDecision);
                
                logger.debug('SAVE_STEP', 'Decision saved, redirecting to view-decision', { decisionId: data.id });
                
                // Return redirect information
                return res.json({
                    success: true,
                    redirect: `/decision/${data.id}`,
                    decisionId: data.id
                });
            } catch (error) {
                logger.error('SAVE_STEP', 'Error saving decision for redirection', error);
                // If there's an error saving, fall back to the regular JSON response
            }
        }

        // For all other steps, prepare the regular response
        const response = { 
            success: true,
            nextStep: step + 1,
            currentId: data.id,
            criteria: decision.criteria,
            weights: decision.weights,
            alternatives: decision.alternatives,
            isAuthenticated: req.isAuthenticated(),
            user: req.user ? { id: req.user.id } : null
        };

        logger.debug('SAVE_STEP', 'Sending response', response);
        res.json(response);
    } catch (error) {
        logger.error('SAVE_STEP', 'Error processing request', error);
        res.status(400).json({ 
            success: false, 
            error: error.message || 'An error occurred',
            isAuthenticated: req.isAuthenticated()
        });
    }
});

// Auth routes
app.use('/', authRoutes);

// Decision routes
app.use('/', decisionsRoutes);

// Error handling
app.use((req, res, next) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you requested could not be found.',
    statusCode: 404
  });
});

app.use((err, req, res, next) => {
  logger.error('SERVER', 'Unexpected error', err);
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'An unexpected error occurred. Please try again later.',
    statusCode: 500
  });
});

// Start server
app.listen(port, () => {
  logger.info('SERVER', `Server running on port ${port}`);
});
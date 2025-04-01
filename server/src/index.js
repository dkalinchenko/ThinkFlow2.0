const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const db = require('./models');
const authRoutes = require('./routes/auth.routes');
const decisionRoutes = require('./routes/decision.routes');
const criteriaRoutes = require('./routes/criteria.routes');
const alternativeRoutes = require('./routes/alternative.routes');
const scoreRoutes = require('./routes/score.routes');
const invitationRoutes = require('./routes/invitation.routes');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up global socket.io instance to be accessible in routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/api/decisions', criteriaRoutes);
app.use('/api/decisions', alternativeRoutes);
app.use('/api/decisions', scoreRoutes);
app.use('/api/invite', invitationRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to OptiMind API' });
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('joinDecision', (decisionId) => {
    socket.join(`decision_${decisionId}`);
    console.log(`Client joined decision: ${decisionId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Database connection test
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
});

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

module.exports = { app, server }; 
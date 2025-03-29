const express = require('express');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Get the client URL from environment variables
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

// Configure CORS
app.use(cors({
  origin: [clientUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'ThinkFlow API is running' });
});

// In-memory storage for our demo
const users = [
  {
    id: 'user-1',
    name: 'Demo User',
    email: 'demo@example.com',
    password_hash: 'password123' // In a real app, this would be hashed
  }
];

const decisions = [];

// Function to create sample decisions for a new user
const createSampleDecisions = (userId, userName, userEmail) => {
  const sampleDecisions = [
    {
      id: '2d7b9c64-8215-4427-94da-426f7b492a62', // Fixed ID for the public demo decision
      title: "Choosing a Programming Language for New Project",
      description: "We need to select the best programming language for our new web application, considering various technical and team factors.",
      criteria: [
        { id: 'c1', name: "Performance", weight: 1.8 },
        { id: 'c2', name: "Developer Availability", weight: 2.0 },
        { id: 'c3', name: "Ecosystem & Libraries", weight: 1.7 },
        { id: 'c4', name: "Learning Curve", weight: 1.2 },
        { id: 'c5', name: "Long-term Support", weight: 1.5 }
      ],
      alternatives: [
        { id: 'a1', name: "JavaScript/Node.js", description: "Popular for full-stack development with extensive ecosystem" },
        { id: 'a2', name: "Python", description: "Excellent for data processing with simple syntax" },
        { id: 'a3', name: "Go", description: "High performance with great concurrency support" },
        { id: 'a4', name: "Rust", description: "Memory safety without garbage collection, steep learning curve" },
        { id: 'a5', name: "TypeScript", description: "JavaScript with static typing for better maintainability" }
      ],
      isPublic: true
    },
    {
      title: "Choosing a New Laptop",
      description: "I need to purchase a new laptop for work and personal use. I want to find the best balance of performance, portability, and value.",
      criteria: [
        { name: "Performance", weight: 2.0 },
        { name: "Battery Life", weight: 1.5 },
        { name: "Build Quality", weight: 1.2 },
        { name: "Display Quality", weight: 1.3 },
        { name: "Value for Money", weight: 1.8 }
      ],
      alternatives: [
        { name: "MacBook Pro", description: "Apple's flagship laptop with M2 chip" },
        { name: "Dell XPS 15", description: "Premium Windows laptop with excellent build quality" },
        { name: "Lenovo ThinkPad X1", description: "Business-focused laptop with great keyboard" },
        { name: "ASUS ZenBook", description: "Thin and light with good performance for the price" }
      ]
    },
    {
      title: "Family Vacation Destination",
      description: "Planning our annual family vacation. Need to choose a destination that works for everyone, considering various factors.",
      criteria: [
        { name: "Cost", weight: 2.0 },
        { name: "Kid-friendly Activities", weight: 1.8 },
        { name: "Weather", weight: 1.2 },
        { name: "Travel Convenience", weight: 1.5 },
        { name: "Accommodation Options", weight: 1.3 }
      ],
      alternatives: [
        { name: "Beach Resort", description: "All-inclusive beach resort with kids' club" },
        { name: "City Trip", description: "Cultural city with museums and attractions" },
        { name: "Mountain Retreat", description: "Cabin in the mountains with outdoor activities" },
        { name: "Theme Park Vacation", description: "Trip centered around major theme parks" }
      ]
    },
    {
      title: "Hiring a Software Developer",
      description: "We need to hire a new software developer for our team. Evaluating candidates based on skills, experience, and cultural fit.",
      criteria: [
        { name: "Technical Skills", weight: 2.0 },
        { name: "Experience", weight: 1.7 },
        { name: "Communication", weight: 1.5 },
        { name: "Cultural Fit", weight: 1.3 },
        { name: "Salary Requirements", weight: 1.2 }
      ],
      alternatives: [
        { name: "Candidate A", description: "Senior developer with 8 years experience" },
        { name: "Candidate B", description: "Mid-level developer with specific domain knowledge" },
        { name: "Candidate C", description: "Junior developer with impressive projects" },
        { name: "Candidate D", description: "Experienced developer looking to change industries" }
      ]
    },
    // New sample decision 2: Office Location
    {
      title: "Selecting New Office Location",
      description: "Our company is expanding and we need to choose a new office location that balances cost, convenience, and growth potential.",
      criteria: [
        { name: "Rent Cost", weight: 2.0 },
        { name: "Accessibility", weight: 1.7 },
        { name: "Office Space Quality", weight: 1.4 },
        { name: "Proximity to Clients", weight: 1.6 },
        { name: "Growth Potential", weight: 1.8 },
        { name: "Local Amenities", weight: 1.2 }
      ],
      alternatives: [
        { name: "Downtown Location", description: "Central business district with high visibility" },
        { name: "Suburban Office Park", description: "Spacious campus with ample parking but further from city" },
        { name: "Tech Hub Area", description: "Surrounded by other tech companies with talent pool nearby" },
        { name: "Renovated Warehouse", description: "Trendy location with creative space but less conventional" },
        { name: "Shared Office Space", description: "Flexible arrangement with lower commitment but less control" }
      ]
    },
    // New sample decision 3: Project Prioritization
    {
      title: "Project Prioritization for Q3",
      description: "We need to decide which projects to focus on in Q3 given our limited resources and time constraints.",
      criteria: [
        { name: "Revenue Potential", weight: 2.0 },
        { name: "Strategic Alignment", weight: 1.8 },
        { name: "Resource Requirements", weight: 1.5 },
        { name: "Time to Completion", weight: 1.4 },
        { name: "Risk Level", weight: 1.6 },
        { name: "Customer Impact", weight: 1.9 }
      ],
      alternatives: [
        { name: "Mobile App Redesign", description: "Modernize UI/UX of our mobile application" },
        { name: "New Analytics Platform", description: "Build data analytics capabilities for internal and customer use" },
        { name: "Legacy System Migration", description: "Move from outdated systems to new architecture" },
        { name: "Customer Portal Enhancement", description: "Add requested features to customer self-service portal" },
        { name: "International Expansion", description: "Launch products in two new countries" }
      ]
    }
  ];

  const now = new Date().toISOString();
  const createdDecisions = [];
  
  sampleDecisions.forEach(sample => {
    const criteriaIds = sample.criteria.map(c => c.id || uuidv4());
    const alternativeIds = sample.alternatives.map(a => a.id || uuidv4());
    
    const newDecision = {
      id: sample.id || uuidv4(),
      title: sample.title,
      description: sample.description,
      created_by: userId,
      creator: {
        id: userId,
        name: userName,
        email: userEmail
      },
      status: 'active',
      isPublic: Boolean(sample.isPublic),
      is_sample: true,
      created_at: now,
      updated_at: now,
      criteria: sample.criteria.map((criterion, index) => ({
        id: criteriaIds[index],
        name: criterion.name,
        weight: criterion.weight
      })),
      alternatives: sample.alternatives.map((alternative, index) => ({
        id: alternativeIds[index],
        name: alternative.name,
        description: alternative.description || ''
      })),
      scores: [],
      invitations: []
    };
    
    decisions.push(newDecision);
    createdDecisions.push({
      decision: newDecision,
      criteriaIds,
      alternativeIds
    });
  });

  // Helper function to add sample scores and collaborators to a decision
  const addSampleScoresAndCollaborator = (decisionIndex, collaboratorName) => {
    if (decisionIndex >= createdDecisions.length) return;
    
    const decision = createdDecisions[decisionIndex];
    
    // Create user scores with appropriate values for each decision
    const userScores = [];
    
    // Generate scores for each alternative and criterion
    decision.decision.alternatives.forEach((_, altIndex) => {
      decision.decision.criteria.forEach((_, critIndex) => {
        // Generate a score between 2-5, slightly favoring higher scores
        const score = Math.floor(Math.random() * 4) + 2;
        userScores.push({
          alternative_id: decision.alternativeIds[altIndex],
          criterion_id: decision.criteriaIds[critIndex],
          value: score
        });
      });
    });
    
    // Add formatted user scores
    const formattedUserScores = userScores.map(score => ({
      id: uuidv4(),
      user_id: userId,
      user_name: userName,
      alternative_id: score.alternative_id,
      criterion_id: score.criterion_id,
      value: score.value,
      created_at: now
    }));
    
    // Add a fictional collaborator
    const collaboratorId = uuidv4();
    
    // Add invitation for collaborator
    const invitation = {
      id: uuidv4(),
      email: `${collaboratorName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      status: "accepted",
      created_at: now,
      accessToken: uuidv4(),
      accepted_at: now
    };
    
    decision.decision.invitations.push(invitation);
    
    // Create collaborator scores with values that differ slightly from user's score
    const collaboratorScores = [];
    
    // Generate scores for each alternative and criterion
    decision.decision.alternatives.forEach((_, altIndex) => {
      decision.decision.criteria.forEach((_, critIndex) => {
        // Generate a score between 1-5 that might differ from user's score
        let score = Math.floor(Math.random() * 5) + 1;
        
        // Occasionally make it the same as user's score for that item
        const sameAsUser = Math.random() > 0.7; // 30% chance
        if (sameAsUser) {
          const userScore = userScores.find(
            s => s.alternative_id === decision.alternativeIds[altIndex] && 
                 s.criterion_id === decision.criteriaIds[critIndex]
          );
          if (userScore) {
            score = userScore.value;
          }
        }
        
        collaboratorScores.push({
          alternative_id: decision.alternativeIds[altIndex],
          criterion_id: decision.criteriaIds[critIndex],
          value: score
        });
      });
    });
    
    // Add formatted collaborator scores
    const formattedCollaboratorScores = collaboratorScores.map(score => ({
      id: uuidv4(),
      user_id: collaboratorId,
      user_name: collaboratorName,
      alternative_id: score.alternative_id,
      criterion_id: score.criterion_id,
      value: score.value,
      created_at: now
    }));
    
    // Add all scores to the decision
    decision.decision.scores = [...formattedUserScores, ...formattedCollaboratorScores];
  };
  
  // Add scores and collaborators to all decisions
  addSampleScoresAndCollaborator(0, "Tech Advisor");
  addSampleScoresAndCollaborator(1, "Family Member");
  addSampleScoresAndCollaborator(2, "Team Lead");
  addSampleScoresAndCollaborator(3, "Lead Developer");
  addSampleScoresAndCollaborator(4, "Operations Manager");
  addSampleScoresAndCollaborator(5, "Product Owner");
};

// Function to reset and initialize demo account
const resetDemoAccount = () => {
  // Remove existing decisions for demo user
  const demoUserId = users[0].id;
  // Keep only decisions that aren't from the demo user
  const nonDemoDecisions = decisions.filter(d => d.created_by !== demoUserId);
  decisions.length = 0; // Clear the array
  decisions.push(...nonDemoDecisions); // Add back non-demo decisions

  // Create fresh sample decisions
  console.log('Creating fresh sample decisions for demo account...');
  createSampleDecisions(users[0].id, users[0].name, users[0].email);
  console.log(`Created ${decisions.filter(d => d.created_by === demoUserId).length} sample decisions for the demo user`);
};

// Remove any existing demo user decisions first
decisions.splice(0, decisions.length, ...decisions.filter(d => d.created_by !== users[0].id));

// Initialize the demo account with sample decisions
console.log('Creating sample decisions for demo account...');
createSampleDecisions(users[0].id, users[0].name, users[0].email);
console.log(`Created ${decisions.filter(d => d.created_by === users[0].id).length} sample decisions for the demo user`);

// Mock auth middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_for_demo');
    
    // Find user by id
    const user = users.find(u => u.id === decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Store user info in request object (exclude password)
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name
    };
    
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to ThinkFlow API' });
});

// AUTH ROUTES
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  
  // Check if required fields are provided
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email, and password'
    });
  }
  
  // Check if user already exists
  if (users.some(user => user.email === email)) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }
  
  // Create new user
  const newUser = {
    id: uuidv4(),
    name,
    email,
    password_hash: password // In a real app, this would be hashed
  };
  
  users.push(newUser);
  
  // Create sample decisions for the new user
  createSampleDecisions(newUser.id, newUser.name, newUser.email);
  
  // Generate JWT token
  const token = jwt.sign(
    { id: newUser.id, email: newUser.email },
    process.env.JWT_SECRET || 'secret_key_for_demo',
    { expiresIn: '24h' }
  );
  
  // Return user info and token (exclude password)
  return res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Check if required fields are provided
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }
  
  // Find user by email
  const user = users.find(user => user.email === email);
  
  // Check if user exists and password matches
  if (!user || user.password_hash !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
  
  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'secret_key_for_demo',
    { expiresIn: '24h' }
  );
  
  // Return user info and token (exclude password)
  return res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  // User info is already in req.user from the middleware
  return res.status(200).json({
    success: true,
    user: req.user
  });
});

// DECISION ROUTES
app.get('/api/decisions', authMiddleware, (req, res) => {
  // Get decisions created by the authenticated user
  const userDecisions = decisions.filter(decision => 
    decision.created_by === req.user.id || 
    decision.invitations.some(invite => invite.email === req.user.email)
  );
  
  return res.status(200).json({
    success: true,
    count: userDecisions.length,
    data: userDecisions
  });
});

app.post('/api/decisions', authMiddleware, (req, res) => {
  const { title, description, criteria = [], alternatives = [], isPublic = false } = req.body;
  
  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Title is required'
    });
  }
  
  const newDecision = {
    id: uuidv4(),
    title,
    description: description || '',
    created_by: req.user.id,
    creator: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    },
    status: 'active',
    isPublic: Boolean(isPublic),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    criteria: criteria.map(criterion => ({
      id: uuidv4(),
      name: criterion.name,
      weight: parseFloat(criterion.weight) || 1.0
    })),
    alternatives: alternatives.map(alternative => ({
      id: uuidv4(),
      name: alternative.name,
      description: alternative.description || ''
    })),
    scores: [],
    invitations: []
  };
  
  decisions.push(newDecision);
  
  return res.status(201).json({
    success: true,
    data: newDecision
  });
});

// Update the helper function to be more robust and provide debugging
const userHasAccessToDecision = (decision, userId, userEmail) => {
  // For debugging purposes
  console.log('Access check:');
  console.log('User ID:', userId);
  console.log('User Email:', userEmail);
  console.log('Decision Creator ID:', decision.created_by);
  console.log('Decision Invitations:', decision.invitations);
  
  // User is the creator
  if (decision.created_by === userId) {
    console.log('User is the creator - access granted');
    return true;
  }
  
  // User is an accepted collaborator (case insensitive)
  const isCollaborator = decision.invitations.some(
    invite => 
      invite.email.toLowerCase() === userEmail.toLowerCase() && 
      invite.status === 'accepted'
  );
  
  console.log('Is accepted collaborator:', isCollaborator);
  return isCollaborator;
};

// Public access to a decision (if it's marked as public)
app.get('/api/public/decisions/:id', (req, res) => {
  const decision = decisions.find(d => d.id === req.params.id);
  
  if (!decision) {
    return res.status(404).json({
      success: false,
      message: 'Decision not found'
    });
  }
  
  // Check if decision is public
  if (!decision.isPublic) {
    return res.status(403).json({
      success: false,
      message: 'This decision is not publicly accessible'
    });
  }
  
  // For public access, we should remove some sensitive information
  // Create a copy without invitations and with limited creator info
  const publicDecision = {
    ...decision,
    creator: {
      name: decision.creator.name,
      // Remove email and id for privacy
    },
    invitations: [], // Remove invitations data for privacy
    // Keep the scores for collaborative data
  };
  
  return res.status(200).json({
    success: true,
    data: publicDecision
  });
});

// List all public decisions (no auth required)
app.get('/api/public/decisions', (req, res) => {
  const publicDecisions = decisions.filter(d => d.isPublic === true);
  
  // Create a simplified list with just essential info
  const simplifiedList = publicDecisions.map(d => ({
    id: d.id,
    title: d.title,
    description: d.description,
    created_at: d.created_at,
    creator_name: d.creator.name
  }));
  
  return res.status(200).json({
    success: true,
    data: simplifiedList
  });
});

app.get('/api/decisions/:id', authMiddleware, (req, res) => {
  const decision = decisions.find(d => d.id === req.params.id);
  
  if (!decision) {
    return res.status(404).json({
      success: false,
      message: 'Decision not found'
    });
  }
  
  // Check if user has access to this decision
  const hasAccess = userHasAccessToDecision(decision, req.user.id, req.user.email);
  
  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this decision'
    });
  }
  
  return res.status(200).json({
    success: true,
    data: decision
  });
});

app.put('/api/decisions/:id', authMiddleware, (req, res) => {
  const decisionId = req.params.id;
  const decisionIndex = decisions.findIndex(d => d.id === decisionId);
  
  if (decisionIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Decision not found'
    });
  }
  
  const decision = decisions[decisionIndex];
  
  // Check if user is the creator of the decision
  if (decision.created_by !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Only the creator can update this decision'
    });
  }
  
  // Update fields
  const { title, description, criteria, alternatives, status, isPublic } = req.body;
  
  if (title) decision.title = title;
  if (description !== undefined) decision.description = description;
  if (status) decision.status = status;
  if (isPublic !== undefined) decision.isPublic = Boolean(isPublic);
  
  // Update criteria if provided
  if (criteria && Array.isArray(criteria)) {
    decision.criteria = criteria.map(criterion => {
      // If existing criterion, preserve ID
      if (criterion.id && decision.criteria.some(c => c.id === criterion.id)) {
        return {
          ...criterion,
          weight: parseFloat(criterion.weight) || 1.0
        };
      } else {
        // New criterion
        return {
          id: uuidv4(),
          name: criterion.name,
          weight: parseFloat(criterion.weight) || 1.0
        };
      }
    });
  }
  
  // Update alternatives if provided
  if (alternatives && Array.isArray(alternatives)) {
    decision.alternatives = alternatives.map(alternative => {
      // If existing alternative, preserve ID
      if (alternative.id && decision.alternatives.some(a => a.id === alternative.id)) {
        return {
          ...alternative,
          description: alternative.description || ''
        };
      } else {
        // New alternative
        return {
          id: uuidv4(),
          name: alternative.name,
          description: alternative.description || ''
        };
      }
    });
  }
  
  // Update timestamp
  decision.updated_at = new Date().toISOString();
  
  return res.status(200).json({
    success: true,
    data: decision
  });
});

app.delete('/api/decisions/:id', authMiddleware, (req, res) => {
  const decisionIndex = decisions.findIndex(d => d.id === req.params.id);
  
  if (decisionIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Decision not found'
    });
  }
  
  const decision = decisions[decisionIndex];
  
  // Check if user is the creator of the decision
  if (decision.created_by !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Only the creator can delete this decision'
    });
  }
  
  // Remove from array
  decisions.splice(decisionIndex, 1);
  
  return res.status(200).json({
    success: true,
    data: {}
  });
});

// Update the scoring endpoint to use this function 
app.post('/api/decisions/:id/scores', authMiddleware, (req, res) => {
  const decisionId = req.params.id;
  const { scores } = req.body;
  
  if (!Array.isArray(scores)) {
    return res.status(400).json({
      success: false,
      message: 'Scores must be an array'
    });
  }
  
  const decisionIndex = decisions.findIndex(d => d.id === decisionId);
  
  if (decisionIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Decision not found'
    });
  }
  
  const decision = decisions[decisionIndex];
  
  // Check if user has access to this decision
  const hasAccess = userHasAccessToDecision(decision, req.user.id, req.user.email);
  
  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this decision'
    });
  }
  
  // Remove existing scores by this user
  const filteredScores = decision.scores.filter(score => score.user_id !== req.user.id);
  
  // Add new scores with user_id
  const newScores = scores.map(score => ({
    id: uuidv4(),
    user_id: req.user.id,
    user_name: req.user.name,
    alternative_id: score.alternative_id,
    criterion_id: score.criterion_id,
    value: score.value,
    created_at: new Date().toISOString()
  }));
  
  // Update decision with new scores
  decision.scores = [...filteredScores, ...newScores];
  decision.updated_at = new Date().toISOString();
  
  // Update in the array
  decisions[decisionIndex] = decision;
  
  return res.status(200).json({
    success: true,
    data: decision
  });
});

// Update the get results endpoint to use this function
app.get('/api/decisions/:id/results', authMiddleware, (req, res) => {
  const decisionId = req.params.id;
  const decision = decisions.find(d => d.id === decisionId);
  
  if (!decision) {
    return res.status(404).json({
      success: false,
      message: 'Decision not found'
    });
  }
  
  // Check if user has access to this decision
  const hasAccess = userHasAccessToDecision(decision, req.user.id, req.user.email);
  
  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this decision'
    });
  }
  
  // Calculate results
  const results = [];
  
  decision.alternatives.forEach(alternative => {
    let totalWeightedScore = 0;
    let maxPossibleScore = 0;
    const criteriaScores = [];
    
    decision.criteria.forEach(criterion => {
      // Get all scores for this alternative and criterion
      const relevantScores = decision.scores.filter(
        score => score.alternative_id === alternative.id && score.criterion_id === criterion.id
      );
      
      // Calculate average score if there are any scores
      const averageScore = relevantScores.length > 0
        ? relevantScores.reduce((sum, score) => sum + score.value, 0) / relevantScores.length
        : 0;
      
      // Calculate weighted score
      const weightedScore = averageScore * criterion.weight;
      totalWeightedScore += weightedScore;
      maxPossibleScore += 5 * criterion.weight; // 5 is max rating
      
      criteriaScores.push({
        criterion_id: criterion.id,
        criterion_name: criterion.name,
        criterion_weight: criterion.weight,
        average_score: averageScore,
        weighted_score: weightedScore
      });
    });
    
    // Calculate percentage of max possible score
    const percentageScore = maxPossibleScore > 0
      ? (totalWeightedScore / maxPossibleScore) * 100
      : 0;
    
    results.push({
      alternative_id: alternative.id,
      alternative_name: alternative.name,
      criteria_scores: criteriaScores,
      total_weighted_score: totalWeightedScore,
      max_possible_score: maxPossibleScore,
      percentage_score: percentageScore
    });
  });
  
  // Sort by total weighted score in descending order
  const sortedResults = results.sort((a, b) => b.total_weighted_score - a.total_weighted_score);
  
  return res.status(200).json({
    success: true,
    data: {
      decision_id: decision.id,
      decision_title: decision.title,
      results: sortedResults
    }
  });
});

// Invitation routes
app.post('/api/decisions/:id/invitations', authMiddleware, (req, res) => {
  const decisionId = req.params.id;
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }
  
  const decisionIndex = decisions.findIndex(d => d.id === decisionId);
  
  if (decisionIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Decision not found'
    });
  }
  
  const decision = decisions[decisionIndex];
  
  // Check if user is the creator of the decision
  if (decision.created_by !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Only the creator can send invitations'
    });
  }
  
  // Check if invitation already exists
  if (decision.invitations.some(invite => invite.email === email)) {
    return res.status(400).json({
      success: false,
      message: 'This email has already been invited'
    });
  }
  
  // Generate a unique token for the invitation link
  const accessToken = uuidv4();
  
  const newInvitation = {
    id: uuidv4(),
    email,
    status: 'pending',
    created_at: new Date().toISOString(),
    accessToken: accessToken
  };
  
  decision.invitations.push(newInvitation);
  decision.updated_at = new Date().toISOString();
  
  // Update in the array
  decisions[decisionIndex] = decision;
  
  return res.status(200).json({
    success: true,
    data: newInvitation
  });
});

// Update the invitation acceptance endpoint to return more information
app.get('/api/invitations/:token', (req, res) => {
  const { token } = req.params;
  
  console.log('Invitation acceptance request for token:', token);
  
  // Find the invitation with this token
  let foundInvitation = null;
  let foundDecision = null;
  
  for (const decision of decisions) {
    const invitation = decision.invitations.find(inv => inv.accessToken === token);
    if (invitation) {
      foundInvitation = invitation;
      foundDecision = decision;
      break;
    }
  }
  
  if (!foundInvitation) {
    console.log('No invitation found with token:', token);
    return res.status(404).json({
      success: false,
      message: 'Invalid or expired invitation link'
    });
  }
  
  console.log('Found invitation:', foundInvitation);
  
  // Update invitation status to accepted
  foundInvitation.status = 'accepted';
  foundInvitation.accepted_at = new Date().toISOString();
  
  console.log('Updated invitation status to accepted:', foundInvitation);
  
  return res.status(200).json({
    success: true,
    message: 'Invitation accepted successfully',
    decision: {
      id: foundDecision.id,
      title: foundDecision.title,
      created_by: foundDecision.created_by,
      creator: foundDecision.creator
    },
    invitation: {
      id: foundInvitation.id,
      email: foundInvitation.email,
      status: foundInvitation.status,
      created_at: foundInvitation.created_at,
      accepted_at: foundInvitation.accepted_at
    }
  });
});

// Add a new endpoint to check collaboration permissions
app.get('/api/decisions/:id/check-permissions', authMiddleware, (req, res) => {
  const decision = decisions.find(d => d.id === req.params.id);
  
  if (!decision) {
    return res.status(404).json({
      success: false,
      message: 'Decision not found'
    });
  }
  
  // Gather all the information about permissions
  const isCreator = decision.created_by === req.user.id;
  
  // Find matching invitations (more permissive search for debugging)
  const matchingInvitations = decision.invitations.filter(invite => 
    invite.email.toLowerCase() === req.user.email.toLowerCase()
  );
  
  // Check strict permissions
  const hasAccess = userHasAccessToDecision(decision, req.user.id, req.user.email);
  
  return res.status(200).json({
    success: true,
    permissions: {
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name
      },
      isCreator,
      matchingInvitations,
      hasAccess,
      allInvitations: decision.invitations,
      decisionCreatorId: decision.created_by
    }
  });
});

// Initialize the demo account with fresh sample decisions
resetDemoAccount();

// Start server with proper error handling
const PORT = 5001; // Use a different port
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
})
.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please free up the port or use a different one.`);
    // Try to close gracefully
    server.close();
  } else {
    console.error('Server error:', error);
  }
});

// Prevent server from crashing on unhandled exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Keep server running despite the error
});

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Keep server running despite the error
});

module.exports = { app, server }; 
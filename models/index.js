const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const logger = require('../utils/logger');

// Initialize Sequelize with SQLite for development and PostgreSQL for production
let sequelize;
if (process.env.NODE_ENV === 'production') {
  // Use PostgreSQL in production
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Use SQLite in development
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database-new.sqlite'),
    logging: false
  });
}

// Test connection
sequelize
  .authenticate()
  .then(() => {
    logger.info('DATABASE', 'Connection has been established successfully');
  })
  .catch(err => {
    logger.error('DATABASE', 'Unable to connect to the database', err);
  });

// Helper function for JSON fields to avoid repetition
const jsonField = (defaultValue) => ({
  type: DataTypes.TEXT,
  get() {
    const value = this.getDataValue(this._currentField);
    return value ? JSON.parse(value) : defaultValue;
  },
  set(value) {
    this.setDataValue(this._currentField, JSON.stringify(value));
  }
});

// Define User model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// Define Decision model
const Decision = sequelize.define('Decision', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Simplified JSON field definitions using our helper function
  criteria: {
    ...jsonField([]),
    _currentField: 'criteria'
  },
  weights: {
    ...jsonField({}),
    _currentField: 'weights'
  },
  alternatives: {
    ...jsonField([]),
    _currentField: 'alternatives'
  },
  evaluations: {
    ...jsonField({}),
    _currentField: 'evaluations'
  },
  results: {
    ...jsonField({}),
    _currentField: 'results'
  },
  participants: {
    ...jsonField({ weights: [], evaluations: [] }),
    _currentField: 'participants'
  }
});

// Define relationships
User.hasMany(Decision, { foreignKey: 'userId' });
Decision.belongsTo(User, { foreignKey: 'userId' });

// Adding instance methods to Decision model for common operations
Decision.prototype.calculateScore = function(alternative, weights, evaluations) {
  return Object.keys(weights).reduce((total, criterion) => {
    const weight = weights[criterion] / 100; // Convert percentage to decimal
    const score = evaluations[alternative][criterion] || 0;
    return total + (weight * score);
  }, 0);
};

// Sync models with database
const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('DATABASE', 'Connection established successfully');
    
    await sequelize.sync({ force: false });
    logger.info('DATABASE', 'All models synchronized successfully');
    
    return true;
  } catch (error) {
    logger.error('DATABASE', 'Failed to initialize database', error);
    return false;
  }
};

module.exports = {
  sequelize,
  User,
  Decision,
  initDatabase
}; 
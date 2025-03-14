module.exports = (sequelize, DataTypes) => {
  const Score = sequelize.define('Score', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    decision_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'decisions',
        key: 'id'
      }
    },
    alternative_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'alternatives',
        key: 'id'
      }
    },
    criteria_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'criteria',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 10
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'scores',
    timestamps: true,
    updatedAt: false,
    underscored: true
  });

  Score.associate = (models) => {
    // Score belongs to a decision
    Score.belongsTo(models.Decision, {
      foreignKey: 'decision_id',
      as: 'decision'
    });

    // Score belongs to an alternative
    Score.belongsTo(models.Alternative, {
      foreignKey: 'alternative_id',
      as: 'alternative'
    });

    // Score belongs to a criteria
    Score.belongsTo(models.Criteria, {
      foreignKey: 'criteria_id',
      as: 'criteria'
    });

    // Score belongs to a user
    Score.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  // Add a unique constraint for user+decision+alternative+criteria
  Score.addHook('beforeCreate', async (score, options) => {
    const existingScore = await Score.findOne({
      where: {
        decision_id: score.decision_id,
        alternative_id: score.alternative_id,
        criteria_id: score.criteria_id,
        user_id: score.user_id
      },
      transaction: options.transaction
    });

    if (existingScore) {
      throw new Error('User has already scored this alternative for this criteria in this decision');
    }
  });

  return Score;
}; 
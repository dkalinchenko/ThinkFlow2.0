module.exports = (sequelize, DataTypes) => {
  const Criteria = sequelize.define('Criteria', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 1.0,
      validate: {
        min: 0
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'criteria',
    timestamps: true,
    underscored: true
  });

  Criteria.associate = (models) => {
    // Criteria belongs to a decision
    Criteria.belongsTo(models.Decision, {
      foreignKey: 'decision_id',
      as: 'decision'
    });

    // Criteria has many scores
    Criteria.hasMany(models.Score, {
      foreignKey: 'criteria_id',
      as: 'scores'
    });
  };

  return Criteria;
}; 
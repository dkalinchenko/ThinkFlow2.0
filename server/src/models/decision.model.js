module.exports = (sequelize, DataTypes) => {
  const Decision = sequelize.define('Decision', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'archived'),
      defaultValue: 'active'
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
    tableName: 'decisions',
    timestamps: true,
    underscored: true
  });

  Decision.associate = (models) => {
    // Decision belongs to a user (creator)
    Decision.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });

    // Decision has many criteria
    Decision.hasMany(models.Criteria, {
      foreignKey: 'decision_id',
      as: 'criteria'
    });

    // Decision has many alternatives
    Decision.hasMany(models.Alternative, {
      foreignKey: 'decision_id',
      as: 'alternatives'
    });

    // Decision has many scores
    Decision.hasMany(models.Score, {
      foreignKey: 'decision_id',
      as: 'scores'
    });

    // Decision has many invitations
    Decision.hasMany(models.Invitation, {
      foreignKey: 'decision_id',
      as: 'invitations'
    });
  };

  return Decision;
}; 
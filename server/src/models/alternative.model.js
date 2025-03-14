module.exports = (sequelize, DataTypes) => {
  const Alternative = sequelize.define('Alternative', {
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'alternatives',
    timestamps: true,
    underscored: true
  });

  Alternative.associate = (models) => {
    // Alternative belongs to a decision
    Alternative.belongsTo(models.Decision, {
      foreignKey: 'decision_id',
      as: 'decision'
    });

    // Alternative has many scores
    Alternative.hasMany(models.Score, {
      foreignKey: 'alternative_id',
      as: 'scores'
    });
  };

  return Alternative;
}; 
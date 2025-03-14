module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false
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
    tableName: 'users',
    timestamps: true,
    underscored: true
  });

  User.associate = (models) => {
    // User can create many decisions
    User.hasMany(models.Decision, {
      foreignKey: 'created_by',
      as: 'decisions'
    });

    // User can submit many scores
    User.hasMany(models.Score, {
      foreignKey: 'user_id',
      as: 'scores'
    });

    // User can send many invitations
    User.hasMany(models.Invitation, {
      foreignKey: 'inviter_id',
      as: 'sent_invitations'
    });
  };

  return User;
}; 
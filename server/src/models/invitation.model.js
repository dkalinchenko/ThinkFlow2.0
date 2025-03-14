const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
  const Invitation = sequelize.define('Invitation', {
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
    inviter_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    invitee_email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      defaultValue: () => crypto.randomBytes(32).toString('hex')
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined'),
      defaultValue: 'pending'
    },
    sent_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7); // 7 days expiry
        return expiryDate;
      }
    }
  }, {
    tableName: 'invitations',
    timestamps: false,
    underscored: true
  });

  Invitation.associate = (models) => {
    // Invitation belongs to a decision
    Invitation.belongsTo(models.Decision, {
      foreignKey: 'decision_id',
      as: 'decision'
    });

    // Invitation belongs to a user (inviter)
    Invitation.belongsTo(models.User, {
      foreignKey: 'inviter_id',
      as: 'inviter'
    });
  };

  Invitation.prototype.isExpired = function() {
    return new Date() > this.expires_at;
  };

  return Invitation;
}; 
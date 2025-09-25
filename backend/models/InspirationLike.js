const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InspirationLike = sequelize.define('InspirationLike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  inspiration_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'inspirations',
      key: 'id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'inspiration_likes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'inspiration_id']
    }
  ]
});

module.exports = InspirationLike;
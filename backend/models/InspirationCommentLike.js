const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InspirationCommentLike = sequelize.define('InspirationCommentLike', {
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
  comment_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'inspiration_comments',
      key: 'id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'inspiration_comment_likes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'comment_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['comment_id']
    }
  ]
});

module.exports = InspirationCommentLike;
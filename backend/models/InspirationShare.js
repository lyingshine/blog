const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InspirationShare = sequelize.define('InspirationShare', {
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
  original_inspiration_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'inspirations',
      key: 'id'
    }
  },
  share_content: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500] // 转发评论最多500字符
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'inspiration_shares',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['inspiration_id']
    },
    {
      fields: ['original_inspiration_id']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = InspirationShare;
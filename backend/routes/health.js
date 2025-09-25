const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// 健康检查接口
router.get('/', async (req, res) => {
  try {
    // 检查数据库连接
    await pool.execute('SELECT 1');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        server: 'running'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
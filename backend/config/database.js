const mysql = require('mysql2/promise');
const path = require('path');

// 根据环境加载配置
const env = process.env.NODE_ENV || 'development';
require('dotenv').config({ 
  path: path.resolve(process.cwd(), `../.env.${env}`)
});

// 加载环境特定配置
let config;
try {
  config = require(`./${env}.js`);
} catch (error) {
  console.warn(`未找到 ${env} 环境配置，使用默认配置`);
  config = require('./development.js');
}

// 数据库连接池配置
const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  waitForConnections: true,
  connectionLimit: config.database.connectionLimit,
  queueLimit: 0,
  charset: config.database.charset
});

// 测试数据库连接
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection,
  config
};
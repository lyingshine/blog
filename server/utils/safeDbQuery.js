const pool = require('../db/pool');

/**
 * 使用连接池中的连接执行查询操作，确保连接在使用后被释放
 * @param {Function} queryFn - 接收连接对象作为参数的异步查询函数
 * @returns {Promise} 查询结果
 */
const withConnection = async (queryFn) => {
  let connection;
  try {
    connection = await pool.getConnection();
    return await queryFn(connection);
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (err) {
        console.error('Error releasing connection:', err);
      }
    }
  }
};

module.exports = {
  withConnection
};
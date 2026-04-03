const mysql = require('mysql2/promise')

const READ_POOL_LIMIT = Math.max(2, Number(process.env.DB_READ_POOL_LIMIT || 20))
const WRITE_POOL_LIMIT = Math.max(1, Number(process.env.DB_WRITE_POOL_LIMIT || 10))

const writePool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '132014',
  database: 'blog_db',
  waitForConnections: true,
  connectionLimit: WRITE_POOL_LIMIT,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
  connectTimeout: 60000,
  idleTimeout: 20000
})

const readPool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '132014',
  database: 'blog_db',
  waitForConnections: true,
  connectionLimit: READ_POOL_LIMIT,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
  connectTimeout: 60000,
  idleTimeout: 20000
})

const pool = {
  query: (...args) => Promise.resolve(readPool.query(...args)),
  execute: (...args) => Promise.resolve(readPool.execute(...args)),
  getConnection: () => readPool.getConnection(),
  end: () => Promise.all([readPool.end(), writePool.end()])
}

pool.write = (...args) => Promise.resolve(writePool.query(...args))
pool.read = (...args) => Promise.resolve(readPool.query(...args))

module.exports = {
  ...pool,
  readPool,
  writePool
}

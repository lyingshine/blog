const mysql = require('mysql2/promise')

const READ_POOL_LIMIT = Math.max(2, Number(process.env.DB_READ_POOL_LIMIT || 20))
const WRITE_POOL_LIMIT = Math.max(1, Number(process.env.DB_WRITE_POOL_LIMIT || 10))

const DB_HOST = process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1'
const DB_PORT = Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306)
const DB_USER = process.env.DB_USER || process.env.MYSQL_USER || 'root'
const DB_PASSWORD = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || ''
const DB_NAME = process.env.DB_NAME || process.env.MYSQL_DATABASE || 'blog_db'

const writePool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
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
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
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

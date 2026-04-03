const mysql = require('mysql2/promise')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = Number(process.env.DB_PORT || 3306)
const DB_USER = process.env.DB_USER || 'root'
const DB_PASSWORD = process.env.DB_PASSWORD || ''
const DB_NAME = process.env.DB_NAME || 'blog_db'

async function ensureTables(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      email VARCHAR(200) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      avatar VARCHAR(300) DEFAULT 'U',
      headline VARCHAR(120) DEFAULT '',
      role VARCHAR(20) DEFAULT 'user',
      bio VARCHAR(500) DEFAULT '',
      location VARCHAR(100) DEFAULT '',
      company VARCHAR(200) DEFAULT '',
      website VARCHAR(300) DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_username (username),
      INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await conn.query(`
    CREATE TABLE IF NOT EXISTS articles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(300) NOT NULL,
      category VARCHAR(50) DEFAULT '未分类',
      read_time INT DEFAULT 5,
      excerpt TEXT,
      description TEXT,
      gradient VARCHAR(200),
      author_id INT NOT NULL,
      author_username VARCHAR(100) DEFAULT '',
      author_avatar VARCHAR(300) DEFAULT '',
      content LONGTEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_author (author_id),
      INDEX idx_category (category),
      INDEX idx_created (created_at),
      CONSTRAINT fk_articles_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await conn.query(`
    CREATE TABLE IF NOT EXISTS statuses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      content TEXT NOT NULL,
      author_id INT NOT NULL,
      author_username VARCHAR(100) DEFAULT '',
      author_avatar VARCHAR(300) DEFAULT '',
      likes INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_author (author_id),
      INDEX idx_created (created_at),
      CONSTRAINT fk_statuses_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await conn.query(`
    CREATE TABLE IF NOT EXISTS daily_plans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      plan_json LONGTEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_daily_plans_updated_at (updated_at),
      CONSTRAINT fk_daily_plans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
}

async function clearUserData(conn) {
  // This operation is destructive by design: remove all user-related data.
  await conn.query('SET FOREIGN_KEY_CHECKS = 0')
  await conn.query('TRUNCATE TABLE daily_plans')
  await conn.query('TRUNCATE TABLE statuses')
  await conn.query('TRUNCATE TABLE articles')
  await conn.query('TRUNCATE TABLE users')
  await conn.query('SET FOREIGN_KEY_CHECKS = 1')
}

async function main() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true
  })

  try {
    console.log('[db] Ensuring tables exist...')
    await ensureTables(conn)

    console.log('[db] Clearing all user-related data...')
    await clearUserData(conn)

    const [[users]] = await conn.query('SELECT COUNT(*) AS count FROM users')
    const [[articles]] = await conn.query('SELECT COUNT(*) AS count FROM articles')
    const [[statuses]] = await conn.query('SELECT COUNT(*) AS count FROM statuses')
    const [[plans]] = await conn.query('SELECT COUNT(*) AS count FROM daily_plans')

    console.log('[db] Done.')
    console.log(`[db] users=${users.count}, articles=${articles.count}, statuses=${statuses.count}, daily_plans=${plans.count}`)
  } finally {
    await conn.end()
  }
}

main().catch((err) => {
  console.error('[db] reset failed:', err)
  process.exit(1)
})

const pool = require('./pool')

let initPromise = null

async function tryAddColumn(tableName, columnSql) {
  try {
    await pool.write(`ALTER TABLE ${tableName} ADD COLUMN ${columnSql}`)
  } catch (error) {
    if (error?.code !== 'ER_DUP_FIELDNAME') {
      throw error
    }
  }
}

async function tryModifyColumn(tableName, columnSql) {
  try {
    await pool.write(`ALTER TABLE ${tableName} MODIFY COLUMN ${columnSql}`)
  } catch (error) {
    // Some managed MySQL instances may reject online column DDL intermittently.
    // Do not block server startup on best-effort widening migration.
    if (!['ER_BAD_FIELD_ERROR', 'ER_GET_ERRNO', 'ER_LOCK_WAIT_TIMEOUT'].includes(error?.code)) {
      throw error
    }
    console.warn(`[Schema] Skip MODIFY ${tableName}: ${error?.code || 'UNKNOWN'} ${error?.sqlMessage || error?.message || ''}`)
  }
}

async function ensureSchema() {
  if (initPromise) return initPromise

  initPromise = (async () => {
    await pool.write(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(200) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(300) DEFAULT 'U',
        role VARCHAR(20) DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await tryAddColumn('users', "headline VARCHAR(120) DEFAULT ''")
    await tryAddColumn('users', "bio VARCHAR(500) DEFAULT ''")
    await tryAddColumn('users', "location VARCHAR(100) DEFAULT ''")
    await tryAddColumn('users', "company VARCHAR(200) DEFAULT ''")
    await tryAddColumn('users', "website VARCHAR(300) DEFAULT ''")
    await tryModifyColumn('users', "avatar VARCHAR(300) DEFAULT 'U'")

    await pool.write(`
      CREATE TABLE IF NOT EXISTS articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(300) NOT NULL,
        category VARCHAR(50) DEFAULT 'Uncategorized',
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

    await tryAddColumn('articles', "author_username VARCHAR(100) DEFAULT ''")
    await tryAddColumn('articles', "author_avatar VARCHAR(300) DEFAULT ''")
    await tryModifyColumn('articles', "author_avatar VARCHAR(300) DEFAULT ''")

    await pool.write(`
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

    await tryAddColumn('statuses', "author_username VARCHAR(100) DEFAULT ''")
    await tryAddColumn('statuses', "author_avatar VARCHAR(300) DEFAULT ''")
    await tryModifyColumn('statuses', "author_avatar VARCHAR(300) DEFAULT ''")

    await pool.write(`
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
  })()

  return initPromise
}

module.exports = ensureSchema

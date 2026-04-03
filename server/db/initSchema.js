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

    await pool.write(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        actor_id INT NULL,
        type VARCHAR(40) DEFAULT 'system',
        title VARCHAR(120) DEFAULT '',
        content VARCHAR(500) DEFAULT '',
        link VARCHAR(300) DEFAULT '',
        is_read TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notifications_user_created (user_id, created_at),
        INDEX idx_notifications_user_read (user_id, is_read),
        CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.write(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        endpoint VARCHAR(700) NOT NULL,
        p256dh VARCHAR(255) NOT NULL,
        auth VARCHAR(255) NOT NULL,
        user_agent VARCHAR(300) DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_push_endpoint (endpoint),
        INDEX idx_push_user (user_id),
        CONSTRAINT fk_push_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.write(`
      CREATE TABLE IF NOT EXISTS content_reactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        target_type VARCHAR(20) NOT NULL,
        target_id INT NOT NULL,
        reaction TINYINT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_reaction_user_target (user_id, target_type, target_id),
        INDEX idx_reaction_target (target_type, target_id, reaction),
        CONSTRAINT fk_content_reactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.write(`
      CREATE TABLE IF NOT EXISTS content_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        target_type VARCHAR(20) NOT NULL,
        target_id INT NOT NULL,
        content TEXT NOT NULL,
        parent_id INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_comment_target (target_type, target_id, created_at),
        INDEX idx_comment_user (user_id),
        CONSTRAINT fk_content_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.write(`
      CREATE TABLE IF NOT EXISTS content_shares (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        target_type VARCHAR(20) NOT NULL,
        target_id INT NOT NULL,
        comment VARCHAR(500) DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_share_target (target_type, target_id, created_at),
        INDEX idx_share_user (user_id),
        CONSTRAINT fk_content_shares_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.write(`
      CREATE TABLE IF NOT EXISTS content_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        target_type VARCHAR(20) NOT NULL,
        target_id INT NOT NULL,
        reason VARCHAR(120) NOT NULL,
        details VARCHAR(600) DEFAULT '',
        status VARCHAR(20) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_report_user_target (user_id, target_type, target_id),
        INDEX idx_report_status (status, created_at),
        CONSTRAINT fk_content_reports_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.write(`
      CREATE TABLE IF NOT EXISTS user_follows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        follower_id INT NOT NULL,
        followee_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_follow_relation (follower_id, followee_id),
        INDEX idx_follow_follower (follower_id, created_at),
        INDEX idx_follow_followee (followee_id, created_at),
        CONSTRAINT fk_user_follows_follower FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_follows_followee FOREIGN KEY (followee_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.write(`
      CREATE TABLE IF NOT EXISTS private_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        content VARCHAR(1000) NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pm_sender_receiver (sender_id, receiver_id, created_at),
        INDEX idx_pm_receiver_sender (receiver_id, sender_id, created_at),
        INDEX idx_pm_receiver_read (receiver_id, is_read, created_at),
        CONSTRAINT fk_private_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_private_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
  })()

  return initPromise
}

module.exports = ensureSchema

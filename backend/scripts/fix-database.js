const { pool } = require('../config/database');

// 修复数据库结构
async function fixDatabase() {
  try {
    console.log('🔧 开始修复数据库结构...');

    // 检查并创建必要的表
    await createTablesIfNotExists();
    
    console.log('✅ 数据库结构修复完成');
    return true;
  } catch (error) {
    console.error('❌ 数据库修复失败:', error);
    throw error;
  }
}

// 创建表结构
async function createTablesIfNotExists() {
  // 用户表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      avatar VARCHAR(255) DEFAULT NULL,
      bio TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // 文章表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS articles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      author_id INT NOT NULL,
      status ENUM('draft', 'published') DEFAULT 'draft',
      featured BOOLEAN DEFAULT FALSE,
      views INT DEFAULT 0,
      likes INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 标签表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tags (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      color VARCHAR(7) DEFAULT '#007bff',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 文章标签关联表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS article_tags (
      id INT AUTO_INCREMENT PRIMARY KEY,
      article_id INT NOT NULL,
      tag_id INT NOT NULL,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
      UNIQUE KEY unique_article_tag (article_id, tag_id)
    )
  `);

  // 评论表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      article_id INT NOT NULL,
      author_id INT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 文章点赞表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS article_likes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      article_id INT NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_article_like (article_id, user_id)
    )
  `);

  // 文章浏览记录表
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS article_views (
      id INT AUTO_INCREMENT PRIMARY KEY,
      article_id INT NOT NULL,
      user_id INT DEFAULT NULL,
      ip_address VARCHAR(45),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  console.log('✅ 数据库表结构检查完成');
}

// 创建示例数据
async function createSampleData() {
  try {
    console.log('🔧 开始创建示例数据...');

    // 检查是否已有数据
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
    if (users[0].count > 0) {
      console.log('⚠️ 数据库中已有用户数据，跳过示例数据创建');
      return;
    }

    // 创建示例用户
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    await pool.execute(`
      INSERT INTO users (username, email, password, bio) VALUES 
      ('admin', 'admin@example.com', ?, '系统管理员'),
      ('author', 'author@example.com', ?, '内容作者')
    `, [hashedPassword, hashedPassword]);

    // 创建示例标签
    await pool.execute(`
      INSERT INTO tags (name, color) VALUES 
      ('技术', '#007bff'),
      ('生活', '#28a745'),
      ('随笔', '#ffc107'),
      ('教程', '#dc3545')
    `);

    // 创建示例文章
    await pool.execute(`
      INSERT INTO articles (title, content, excerpt, author_id, status, featured) VALUES 
      ('欢迎使用博客系统', '这是一个功能完整的博客系统，支持文章发布、评论、标签等功能。', '欢迎使用这个全新的博客系统', 1, 'published', true),
      ('如何使用Markdown', 'Markdown是一种轻量级标记语言，可以用简单的语法来格式化文本。', '学习Markdown的基本语法', 2, 'published', false)
    `);

    console.log('✅ 示例数据创建完成');
  } catch (error) {
    console.error('❌ 创建示例数据失败:', error);
    throw error;
  }
}

module.exports = {
  fixDatabase,
  createSampleData
};
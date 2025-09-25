const { pool } = require('../config/database');

// 修复数据库结构
async function fixDatabase() {
  try {
    console.log('开始修复数据库结构...');

    // 创建用户表
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

    // 创建分类表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建标签表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建文章表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        content LONGTEXT NOT NULL,
        excerpt TEXT DEFAULT NULL,
        featured_image VARCHAR(255) DEFAULT NULL,
        status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
        featured BOOLEAN DEFAULT FALSE,
        views INT DEFAULT 0,
        likes INT DEFAULT 0,
        author_id INT NOT NULL,
        category_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    // 创建文章标签关联表
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

    // 创建评论表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content TEXT NOT NULL,
        author_id INT NOT NULL,
        article_id INT NOT NULL,
        parent_id INT DEFAULT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
      )
    `);

    // 创建文章点赞表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS article_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        article_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_article_like (user_id, article_id)
      )
    `);

    // 创建文章浏览记录表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS article_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        article_id INT NOT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        user_agent TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
      )
    `);

    console.log('数据库结构修复完成！');
  } catch (error) {
    console.error('修复数据库结构失败:', error);
    throw error;
  }
}

// 创建示例数据
async function createSampleData() {
  try {
    console.log('开始创建示例数据...');

    // 检查是否已有数据
    const [existingUsers] = await pool.execute('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count > 0) {
      console.log('数据库中已有用户数据，跳过示例数据创建');
      return;
    }

    // 创建示例分类
    const categories = [
      { name: '技术', description: '技术相关文章' },
      { name: '生活', description: '生活感悟和经验分享' },
      { name: '随笔', description: '随心所欲的文字记录' },
      { name: '教程', description: '各种教程和指南' }
    ];

    for (const category of categories) {
      await pool.execute(
        'INSERT IGNORE INTO categories (name, description) VALUES (?, ?)',
        [category.name, category.description]
      );
    }

    // 创建示例标签
    const tags = ['JavaScript', 'Vue.js', 'Node.js', '前端', '后端', '数据库', '生活感悟', '技术分享'];
    for (const tag of tags) {
      await pool.execute(
        'INSERT IGNORE INTO tags (name) VALUES (?)',
        [tag]
      );
    }

    // 创建示例用户（密码是 123456 的bcrypt哈希）
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    await pool.execute(`
      INSERT IGNORE INTO users (username, email, password, bio) VALUES 
      ('admin', 'admin@example.com', ?, '博客管理员'),
      ('demo_user', 'demo@example.com', ?, '演示用户')
    `, [hashedPassword, hashedPassword]);

    // 获取创建的用户和分类ID
    const [users] = await pool.execute('SELECT id, username FROM users');
    const [categoriesData] = await pool.execute('SELECT id, name FROM categories');
    const [tagsData] = await pool.execute('SELECT id, name FROM tags');

    if (users.length > 0 && categoriesData.length > 0) {
      // 创建示例文章
      const sampleArticles = [
        {
          title: '欢迎来到我的博客',
          content: '这是我的第一篇博客文章。在这里，我将分享我的技术经验、生活感悟和学习心得。希望能够帮助到更多的人，也希望能够与大家交流学习。',
          excerpt: '欢迎来到我的博客，这里将分享技术经验和生活感悟。',
          status: 'published',
          featured: true,
          category: '随笔',
          tags: ['生活感悟']
        },
        {
          title: 'Vue.js 入门指南',
          content: 'Vue.js 是一个渐进式的JavaScript框架，用于构建用户界面。本文将介绍Vue.js的基本概念和使用方法...',
          excerpt: 'Vue.js 入门指南，介绍基本概念和使用方法。',
          status: 'published',
          featured: false,
          category: '技术',
          tags: ['JavaScript', 'Vue.js', '前端']
        },
        {
          title: 'Node.js 后端开发实践',
          content: 'Node.js 是一个基于Chrome V8引擎的JavaScript运行时环境。本文将分享Node.js后端开发的实践经验...',
          excerpt: 'Node.js 后端开发实践经验分享。',
          status: 'published',
          featured: false,
          category: '技术',
          tags: ['Node.js', '后端', '技术分享']
        }
      ];

      for (const article of sampleArticles) {
        const categoryId = categoriesData.find(c => c.name === article.category)?.id;
        const authorId = users[0].id; // 使用第一个用户作为作者

        const [result] = await pool.execute(`
          INSERT INTO articles (title, content, excerpt, status, featured, author_id, category_id, views, likes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          article.title,
          article.content,
          article.excerpt,
          article.status,
          article.featured,
          authorId,
          categoryId,
          Math.floor(Math.random() * 100) + 10, // 随机浏览量
          Math.floor(Math.random() * 20) + 1    // 随机点赞数
        ]);

        // 添加标签关联
        const articleId = result.insertId;
        for (const tagName of article.tags) {
          const tagId = tagsData.find(t => t.name === tagName)?.id;
          if (tagId) {
            await pool.execute(
              'INSERT IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)',
              [articleId, tagId]
            );
          }
        }
      }
    }

    console.log('示例数据创建完成！');
  } catch (error) {
    console.error('创建示例数据失败:', error);
    throw error;
  }
}

module.exports = {
  fixDatabase,
  createSampleData
};
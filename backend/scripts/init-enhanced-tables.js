const { pool } = require('../config/database');

async function initEnhancedTables() {
  try {
    console.log('🚀 开始创建增强功能数据表...');

    // 创建灵感评论点赞表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS inspiration_comment_likes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        comment_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (comment_id) REFERENCES inspiration_comments(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_comment (user_id, comment_id),
        INDEX idx_user_id (user_id),
        INDEX idx_comment_id (comment_id)
      )
    `);
    console.log('✅ inspiration_comment_likes 表创建成功');

    // 创建灵感转发表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS inspiration_shares (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        inspiration_id INT NOT NULL,
        original_inspiration_id INT DEFAULT NULL,
        share_content TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (inspiration_id) REFERENCES inspirations(id) ON DELETE CASCADE,
        FOREIGN KEY (original_inspiration_id) REFERENCES inspirations(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_inspiration_id (inspiration_id),
        INDEX idx_original_inspiration_id (original_inspiration_id),
        INDEX idx_created_at (created_at)
      )
    `);
    console.log('✅ inspiration_shares 表创建成功');

    // 检查并添加缺失的索引
    try {
      await pool.execute(`
        ALTER TABLE inspiration_likes 
        ADD INDEX IF NOT EXISTS idx_inspiration_id (inspiration_id)
      `);
      console.log('✅ inspiration_likes 索引添加成功');
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        console.warn('⚠️ 添加 inspiration_likes 索引时出现警告:', error.message);
      }
    }

    try {
      await pool.execute(`
        ALTER TABLE inspiration_likes 
        ADD INDEX IF NOT EXISTS idx_created_at (created_at)
      `);
      console.log('✅ inspiration_likes 时间索引添加成功');
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        console.warn('⚠️ 添加 inspiration_likes 时间索引时出现警告:', error.message);
      }
    }

    // 检查并添加转发相关字段
    try {
      await pool.execute(`
        ALTER TABLE inspirations 
        ADD COLUMN IF NOT EXISTS share_type ENUM('original', 'share') DEFAULT 'original'
      `);
      console.log('✅ inspirations share_type 字段添加成功');
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        console.warn('⚠️ 添加 share_type 字段时出现警告:', error.message);
      }
    }

    try {
      await pool.execute(`
        ALTER TABLE inspirations 
        ADD COLUMN IF NOT EXISTS original_inspiration_id INT DEFAULT NULL
      `);
      console.log('✅ inspirations original_inspiration_id 字段添加成功');
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        console.warn('⚠️ 添加 original_inspiration_id 字段时出现警告:', error.message);
      }
    }

    try {
      await pool.execute(`
        ALTER TABLE inspirations 
        ADD INDEX IF NOT EXISTS idx_original_inspiration_id (original_inspiration_id)
      `);
      console.log('✅ inspirations 原始灵感索引添加成功');
    } catch (error) {
      if (!error.message.includes('Duplicate key name')) {
        console.warn('⚠️ 添加原始灵感索引时出现警告:', error.message);
      }
    }

    console.log('🎉 增强功能数据表初始化完成！');
    
  } catch (error) {
    console.error('❌ 增强功能数据表创建失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initEnhancedTables()
    .then(() => {
      console.log('增强功能数据库初始化完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('增强功能数据库初始化失败:', error);
      process.exit(1);
    });
}

module.exports = { initEnhancedTables };
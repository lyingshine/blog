const { pool } = require('../config/database');

async function fixEnhancedTables() {
  try {
    console.log('🚀 开始修复增强功能数据表...');

    // 检查并添加缺失的索引
    try {
      // 检查索引是否存在
      const [indexes] = await pool.execute(`
        SHOW INDEX FROM inspiration_likes WHERE Key_name = 'idx_inspiration_id'
      `);
      
      if (indexes.length === 0) {
        await pool.execute(`
          ALTER TABLE inspiration_likes 
          ADD INDEX idx_inspiration_id (inspiration_id)
        `);
        console.log('✅ inspiration_likes inspiration_id 索引添加成功');
      } else {
        console.log('✅ inspiration_likes inspiration_id 索引已存在');
      }
    } catch (error) {
      console.warn('⚠️ 处理 inspiration_likes inspiration_id 索引时出现问题:', error.message);
    }

    try {
      const [indexes] = await pool.execute(`
        SHOW INDEX FROM inspiration_likes WHERE Key_name = 'idx_created_at'
      `);
      
      if (indexes.length === 0) {
        await pool.execute(`
          ALTER TABLE inspiration_likes 
          ADD INDEX idx_created_at (created_at)
        `);
        console.log('✅ inspiration_likes created_at 索引添加成功');
      } else {
        console.log('✅ inspiration_likes created_at 索引已存在');
      }
    } catch (error) {
      console.warn('⚠️ 处理 inspiration_likes created_at 索引时出现问题:', error.message);
    }

    // 检查并添加转发相关字段
    try {
      const [columns] = await pool.execute(`
        SHOW COLUMNS FROM inspirations LIKE 'share_type'
      `);
      
      if (columns.length === 0) {
        await pool.execute(`
          ALTER TABLE inspirations 
          ADD COLUMN share_type ENUM('original', 'share') DEFAULT 'original'
        `);
        console.log('✅ inspirations share_type 字段添加成功');
      } else {
        console.log('✅ inspirations share_type 字段已存在');
      }
    } catch (error) {
      console.warn('⚠️ 处理 share_type 字段时出现问题:', error.message);
    }

    try {
      const [columns] = await pool.execute(`
        SHOW COLUMNS FROM inspirations LIKE 'original_inspiration_id'
      `);
      
      if (columns.length === 0) {
        await pool.execute(`
          ALTER TABLE inspirations 
          ADD COLUMN original_inspiration_id INT DEFAULT NULL
        `);
        console.log('✅ inspirations original_inspiration_id 字段添加成功');
      } else {
        console.log('✅ inspirations original_inspiration_id 字段已存在');
      }
    } catch (error) {
      console.warn('⚠️ 处理 original_inspiration_id 字段时出现问题:', error.message);
    }

    try {
      const [indexes] = await pool.execute(`
        SHOW INDEX FROM inspirations WHERE Key_name = 'idx_original_inspiration_id'
      `);
      
      if (indexes.length === 0) {
        await pool.execute(`
          ALTER TABLE inspirations 
          ADD INDEX idx_original_inspiration_id (original_inspiration_id)
        `);
        console.log('✅ inspirations original_inspiration_id 索引添加成功');
      } else {
        console.log('✅ inspirations original_inspiration_id 索引已存在');
      }
    } catch (error) {
      console.warn('⚠️ 处理 original_inspiration_id 索引时出现问题:', error.message);
    }

    // 添加外键约束（如果不存在）
    try {
      const [constraints] = await pool.execute(`
        SELECT CONSTRAINT_NAME 
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'inspirations' 
        AND COLUMN_NAME = 'original_inspiration_id'
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `);
      
      if (constraints.length === 0) {
        await pool.execute(`
          ALTER TABLE inspirations 
          ADD CONSTRAINT fk_inspirations_original 
          FOREIGN KEY (original_inspiration_id) REFERENCES inspirations(id) ON DELETE CASCADE
        `);
        console.log('✅ inspirations 原始灵感外键约束添加成功');
      } else {
        console.log('✅ inspirations 原始灵感外键约束已存在');
      }
    } catch (error) {
      console.warn('⚠️ 处理原始灵感外键约束时出现问题:', error.message);
    }

    console.log('🎉 增强功能数据表修复完成！');
    
  } catch (error) {
    console.error('❌ 增强功能数据表修复失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  fixEnhancedTables()
    .then(() => {
      console.log('增强功能数据库修复完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('增强功能数据库修复失败:', error);
      process.exit(1);
    });
}

module.exports = { fixEnhancedTables };
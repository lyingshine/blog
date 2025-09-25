const { pool } = require('../config/database');

async function checkInspirationTable() {
  try {
    console.log('🔍 检查 inspirations 表结构...');
    
    // 检查表结构
    const [columns] = await pool.execute('DESCRIBE inspirations');
    console.log('\n📋 表结构:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default !== null ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    // 检查现有数据
    const [rows] = await pool.execute('SELECT id, content, likes_count, comments_count, shares_count, created_at FROM inspirations LIMIT 3');
    console.log('\n📊 现有数据:');
    if (rows.length === 0) {
      console.log('  暂无数据');
    } else {
      rows.forEach(row => {
        console.log(`  ID: ${row.id}, 内容: ${row.content.substring(0, 30)}..., 点赞: ${row.likes_count}, 评论: ${row.comments_count}, 分享: ${row.shares_count}`);
      });
    }
    
    // 检查总数
    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM inspirations');
    console.log(`\n📈 总记录数: ${countResult[0].total}`);
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    process.exit(0);
  }
}

checkInspirationTable();
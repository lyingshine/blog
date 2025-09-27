const { pool } = require('./config/database');

async function checkArticles() {
  try {
    console.log('🔍 检查数据库中的文章...');
    
    // 查询所有文章
    const [allArticles] = await pool.execute('SELECT id, title, status, deleted_at, created_at FROM articles');
    console.log('📊 数据库中的所有文章:', allArticles);
    
    // 查询已发布的文章
    const [publishedArticles] = await pool.execute('SELECT id, title, status, deleted_at FROM articles WHERE status = "published" AND deleted_at IS NULL');
    console.log('✅ 已发布的文章:', publishedArticles);
    
    // 查询草稿文章
    const [draftArticles] = await pool.execute('SELECT id, title, status FROM articles WHERE status = "draft"');
    console.log('📝 草稿文章:', draftArticles);
    
    // 查询已删除的文章
    const [deletedArticles] = await pool.execute('SELECT id, title, deleted_at FROM articles WHERE deleted_at IS NOT NULL');
    console.log('🗑️ 已删除的文章:', deletedArticles);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 查询失败:', error);
    process.exit(1);
  }
}

checkArticles();
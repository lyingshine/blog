const { pool } = require('../config/database');

async function createTestInspiration() {
  try {
    console.log('🚀 创建测试灵感数据...');
    
    // 首先检查是否有用户
    const [users] = await pool.execute('SELECT id, username FROM users LIMIT 1');
    if (users.length === 0) {
      console.log('❌ 没有找到用户，请先创建用户');
      return;
    }
    
    const user = users[0];
    console.log(`✅ 使用用户: ${user.username} (ID: ${user.id})`);
    
    // 创建测试灵感
    const testInspirations = [
      {
        content: '今天天气真好！阳光明媚，心情也跟着好起来了 ☀️ #好心情 #阳光',
        tags: JSON.stringify(['好心情', '阳光', '天气']),
        location: '北京市朝阳区',
        is_public: 1
      },
      {
        content: '刚刚完成了一个新项目，感觉很有成就感！💪 继续加油！',
        tags: JSON.stringify(['工作', '成就感', '加油']),
        location: null,
        is_public: 1
      },
      {
        content: '和朋友们一起吃火锅，生活真美好！🔥🍲 #火锅 #友谊',
        tags: JSON.stringify(['火锅', '友谊', '美食']),
        location: '成都市锦江区',
        is_public: 1
      }
    ];
    
    for (const inspiration of testInspirations) {
      const [result] = await pool.execute(`
        INSERT INTO inspirations (user_id, content, images, tags, location, is_public, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        user.id,
        inspiration.content,
        JSON.stringify([]), // 空图片数组
        inspiration.tags,
        inspiration.location,
        inspiration.is_public
      ]);
      
      console.log(`✅ 创建灵感成功，ID: ${result.insertId}`);
    }
    
    // 检查创建结果
    const [inspirations] = await pool.execute(`
      SELECT i.*, u.username 
      FROM inspirations i 
      LEFT JOIN users u ON i.user_id = u.id 
      ORDER BY i.created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n📊 当前灵感列表:');
    inspirations.forEach(inspiration => {
      console.log(`  ID: ${inspiration.id}, 作者: ${inspiration.username}, 内容: ${inspiration.content.substring(0, 30)}...`);
    });
    
  } catch (error) {
    console.error('❌ 创建测试数据失败:', error);
  } finally {
    process.exit(0);
  }
}

createTestInspiration();
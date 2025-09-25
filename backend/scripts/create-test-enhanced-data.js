const { pool } = require('../config/database');

async function createTestEnhancedData() {
  try {
    console.log('🚀 创建增强功能测试数据...');
    
    // 首先检查是否有用户和灵感
    const [users] = await pool.execute('SELECT id, username FROM users LIMIT 3');
    if (users.length === 0) {
      console.log('❌ 没有找到用户，请先创建用户');
      return;
    }

    const [inspirations] = await pool.execute('SELECT id, user_id, content FROM inspirations LIMIT 3');
    if (inspirations.length === 0) {
      console.log('❌ 没有找到灵感，请先创建灵感');
      return;
    }

    console.log(`✅ 找到 ${users.length} 个用户和 ${inspirations.length} 个灵感`);

    // 创建测试评论
    const testComments = [
      {
        inspiration_id: inspirations[0].id,
        user_id: users[0].id,
        content: '这个想法真不错！👍'
      },
      {
        inspiration_id: inspirations[0].id,
        user_id: users.length > 1 ? users[1].id : users[0].id,
        content: '我也有同感，很有启发性'
      },
      {
        inspiration_id: inspirations.length > 1 ? inspirations[1].id : inspirations[0].id,
        user_id: users[0].id,
        content: '分享得很棒！学到了'
      }
    ];

    const commentIds = [];
    for (const comment of testComments) {
      const [result] = await pool.execute(`
        INSERT INTO inspiration_comments (inspiration_id, user_id, content, created_at, updated_at)
        VALUES (?, ?, ?, NOW(), NOW())
      `, [comment.inspiration_id, comment.user_id, comment.content]);
      
      commentIds.push(result.insertId);
      console.log(`✅ 创建评论成功，ID: ${result.insertId}`);

      // 更新灵感的评论数
      await pool.execute(
        'UPDATE inspirations SET comments_count = comments_count + 1 WHERE id = ?',
        [comment.inspiration_id]
      );
    }

    // 创建测试评论点赞
    if (commentIds.length > 0 && users.length > 1) {
      for (let i = 0; i < Math.min(commentIds.length, 2); i++) {
        const commentId = commentIds[i];
        const userId = users[i % users.length].id;
        
        try {
          await pool.execute(`
            INSERT INTO inspiration_comment_likes (user_id, comment_id, created_at)
            VALUES (?, ?, NOW())
          `, [userId, commentId]);
          
          await pool.execute(
            'UPDATE inspiration_comments SET likes_count = likes_count + 1 WHERE id = ?',
            [commentId]
          );
          
          console.log(`✅ 创建评论点赞成功，评论ID: ${commentId}`);
        } catch (error) {
          if (!error.message.includes('Duplicate entry')) {
            console.warn(`⚠️ 创建评论点赞失败:`, error.message);
          }
        }
      }
    }

    // 创建测试转发
    if (inspirations.length > 0 && users.length > 1) {
      const shareContent = '转发一个很有意思的想法，大家看看！';
      const originalInspirationId = inspirations[0].id;
      const shareUserId = users[1].id;

      try {
        // 创建转发记录
        const [shareResult] = await pool.execute(`
          INSERT INTO inspiration_shares (user_id, inspiration_id, original_inspiration_id, share_content, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `, [shareUserId, originalInspirationId, originalInspirationId, shareContent]);

        // 更新原灵感的转发数
        await pool.execute(
          'UPDATE inspirations SET shares_count = shares_count + 1 WHERE id = ?',
          [originalInspirationId]
        );

        // 创建新的转发灵感
        const [newInspirationResult] = await pool.execute(`
          INSERT INTO inspirations (
            user_id, content, images, tags, location, is_public, 
            share_type, original_inspiration_id, created_at, updated_at
          )
          VALUES (?, ?, '[]', '[]', NULL, 1, 'share', ?, NOW(), NOW())
        `, [shareUserId, shareContent, originalInspirationId]);

        console.log(`✅ 创建转发成功，转发ID: ${shareResult.insertId}，新灵感ID: ${newInspirationResult.insertId}`);
      } catch (error) {
        console.warn(`⚠️ 创建转发失败:`, error.message);
      }
    }

    // 创建一些额外的点赞
    for (let i = 0; i < Math.min(inspirations.length, users.length); i++) {
      const inspirationId = inspirations[i].id;
      const userId = users[(i + 1) % users.length].id;
      
      try {
        await pool.execute(`
          INSERT INTO inspiration_likes (user_id, inspiration_id, created_at)
          VALUES (?, ?, NOW())
        `, [userId, inspirationId]);
        
        await pool.execute(
          'UPDATE inspirations SET likes_count = likes_count + 1 WHERE id = ?',
          [inspirationId]
        );
        
        console.log(`✅ 创建灵感点赞成功，灵感ID: ${inspirationId}`);
      } catch (error) {
        if (!error.message.includes('Duplicate entry')) {
          console.warn(`⚠️ 创建灵感点赞失败:`, error.message);
        }
      }
    }

    // 检查创建结果
    const [finalStats] = await pool.execute(`
      SELECT 
        (SELECT COUNT(*) FROM inspiration_comments) as total_comments,
        (SELECT COUNT(*) FROM inspiration_comment_likes) as total_comment_likes,
        (SELECT COUNT(*) FROM inspiration_likes) as total_likes,
        (SELECT COUNT(*) FROM inspiration_shares) as total_shares,
        (SELECT COUNT(*) FROM inspirations WHERE share_type = 'share') as total_share_inspirations
    `);

    console.log('\n📊 增强功能数据统计:');
    console.log(`  评论数: ${finalStats[0].total_comments}`);
    console.log(`  评论点赞数: ${finalStats[0].total_comment_likes}`);
    console.log(`  灵感点赞数: ${finalStats[0].total_likes}`);
    console.log(`  转发记录数: ${finalStats[0].total_shares}`);
    console.log(`  转发灵感数: ${finalStats[0].total_share_inspirations}`);

  } catch (error) {
    console.error('❌ 创建增强功能测试数据失败:', error);
  } finally {
    process.exit(0);
  }
}

createTestEnhancedData();
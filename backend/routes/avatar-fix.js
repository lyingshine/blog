const express = require('express');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

const router = express.Router();

// 修复缺失头像的API端点
router.post('/fix-missing-avatars', async (req, res) => {
  try {
    console.log('🔧 开始修复缺失的头像文件...');
    
    // 查询所有有头像记录的用户
    const [users] = await pool.execute(`
      SELECT id, username, avatar 
      FROM users 
      WHERE avatar IS NOT NULL 
      AND avatar != '' 
      AND avatar LIKE '/uploads/avatars/%'
    `);
    
    const uploadsDir = path.join(__dirname, '../uploads/avatars');
    const fixedUsers = [];
    const errorUsers = [];
    
    for (const user of users) {
      const filename = path.basename(user.avatar);
      const filePath = path.join(uploadsDir, filename);
      
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        try {
          // 设置为默认头像
          const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`;
          
          await pool.execute(
            'UPDATE users SET avatar = ? WHERE id = ?',
            [defaultAvatar, user.id]
          );
          
          fixedUsers.push({
            id: user.id,
            username: user.username,
            oldAvatar: user.avatar,
            newAvatar: defaultAvatar
          });
          
          console.log(`✅ 修复用户 ${user.id} (${user.username}) 的头像`);
        } catch (error) {
          errorUsers.push({
            id: user.id,
            username: user.username,
            error: error.message
          });
          console.error(`❌ 修复用户 ${user.id} 失败:`, error.message);
        }
      }
    }
    
    res.json({
      success: true,
      message: '头像修复完成',
      fixed: fixedUsers,
      errors: errorUsers,
      summary: {
        totalChecked: users.length,
        fixed: fixedUsers.length,
        errors: errorUsers.length
      }
    });
    
  } catch (error) {
    console.error('❌ 修复过程出错:', error);
    res.status(500).json({
      success: false,
      error: '修复过程出错',
      details: error.message
    });
  }
});

// 检查特定用户的头像状态
router.get('/check-user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const [users] = await pool.execute(
      'SELECT id, username, avatar FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    const user = users[0];
    let fileExists = false;
    let filePath = null;
    
    if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const filename = path.basename(user.avatar);
      filePath = path.join(__dirname, '../uploads/avatars', filename);
      fileExists = fs.existsSync(filePath);
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        avatarType: user.avatar ? (user.avatar.startsWith('/uploads/avatars/') ? 'local' : 'external') : 'none',
        fileExists: user.avatar && user.avatar.startsWith('/uploads/avatars/') ? fileExists : null,
        filePath: filePath
      }
    });
    
  } catch (error) {
    console.error('❌ 检查用户头像失败:', error);
    res.status(500).json({
      success: false,
      error: '检查失败',
      details: error.message
    });
  }
});

// 为特定用户设置默认头像
router.post('/set-default-avatar/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { avatarType = 'initials' } = req.body;
    
    // 获取用户信息
    const [users] = await pool.execute(
      'SELECT username FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    const username = users[0].username;
    const defaultAvatar = `https://api.dicebear.com/7.x/${avatarType}/svg?seed=${username}`;
    
    await pool.execute(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [defaultAvatar, userId]
    );
    
    res.json({
      success: true,
      message: '默认头像设置成功',
      userId: userId,
      username: username,
      newAvatar: defaultAvatar
    });
    
  } catch (error) {
    console.error('❌ 设置默认头像失败:', error);
    res.status(500).json({
      success: false,
      error: '设置失败',
      details: error.message
    });
  }
});

module.exports = router;
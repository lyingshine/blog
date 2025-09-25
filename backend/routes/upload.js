const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../config/database');

const router = express.Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名：用户ID_时间戳.扩展名
    const ext = path.extname(file.originalname);
    const filename = `${req.user.id}_${Date.now()}${ext}`;
    cb(null, filename);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 只允许图片文件
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'), false);
  }
};

// 配置multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB限制
  }
});

// 上传头像
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的图片' });
    }

    const userId = req.user.id;
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // 获取用户当前头像
    const [users] = await pool.execute(
      'SELECT avatar FROM users WHERE id = ?',
      [userId]
    );

    const oldAvatar = users[0]?.avatar;

    // 更新数据库中的头像URL
    await pool.execute(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatarUrl, userId]
    );

    // 删除旧头像文件（如果是本地文件）
    if (oldAvatar && oldAvatar.startsWith('/uploads/avatars/')) {
      const oldFilePath = path.join(__dirname, '..', oldAvatar);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    res.json({
      message: '头像上传成功',
      avatar: avatarUrl
    });

  } catch (error) {
    console.error('头像上传失败:', error);
    
    // 删除已上传的文件（如果有错误）
    if (req.file) {
      const filePath = path.join(uploadDir, req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(500).json({ error: '头像上传失败' });
  }
});

// 使用预设头像
router.post('/avatar/preset', authenticateToken, async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    const userId = req.user.id;

    if (!avatarUrl) {
      return res.status(400).json({ error: '请提供头像URL' });
    }

    // 验证是否为允许的预设头像
    const allowedPresets = [
      'https://api.dicebear.com/7.x/avataaars/svg',
      'https://api.dicebear.com/7.x/personas/svg',
      'https://api.dicebear.com/7.x/initials/svg',
      'https://api.dicebear.com/7.x/bottts/svg',
      'https://api.dicebear.com/7.x/identicon/svg'
    ];

    const isValidPreset = allowedPresets.some(preset => avatarUrl.startsWith(preset));
    
    if (!isValidPreset) {
      return res.status(400).json({ error: '无效的预设头像' });
    }

    // 获取用户当前头像
    const [users] = await pool.execute(
      'SELECT avatar FROM users WHERE id = ?',
      [userId]
    );

    const oldAvatar = users[0]?.avatar;

    // 更新数据库中的头像URL
    await pool.execute(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatarUrl, userId]
    );

    // 删除旧头像文件（如果是本地文件）
    if (oldAvatar && oldAvatar.startsWith('/uploads/avatars/')) {
      const oldFilePath = path.join(__dirname, '..', oldAvatar);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    res.json({
      message: '头像更新成功',
      avatar: avatarUrl
    });

  } catch (error) {
    console.error('头像更新失败:', error);
    res.status(500).json({ error: '头像更新失败' });
  }
});

// 获取预设头像列表
router.get('/avatar/presets', (req, res) => {
  const { seed = 'default' } = req.query;
  
  const presets = [
    {
      name: 'Avataaars',
      style: 'avataaars',
      url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
      description: '卡通风格头像'
    },
    {
      name: 'Personas',
      style: 'personas',
      url: `https://api.dicebear.com/7.x/personas/svg?seed=${seed}`,
      description: '简约人物头像'
    },
    {
      name: 'Initials',
      style: 'initials',
      url: `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`,
      description: '字母头像'
    },
    {
      name: 'Bottts',
      style: 'bottts',
      url: `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`,
      description: '机器人头像'
    },
    {
      name: 'Identicon',
      style: 'identicon',
      url: `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`,
      description: '几何图案头像'
    }
  ];

  res.json({ presets });
});

module.exports = router;
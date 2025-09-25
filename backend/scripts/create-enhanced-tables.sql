-- 创建灵感评论点赞表
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
);

-- 创建灵感转发表
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
);

-- 为现有表添加缺失的索引（如果不存在）
ALTER TABLE inspiration_likes ADD INDEX IF NOT EXISTS idx_inspiration_id (inspiration_id);
ALTER TABLE inspiration_likes ADD INDEX IF NOT EXISTS idx_created_at (created_at);

-- 添加转发类型字段到灵感表
ALTER TABLE inspirations ADD COLUMN IF NOT EXISTS share_type ENUM('original', 'share') DEFAULT 'original';
ALTER TABLE inspirations ADD COLUMN IF NOT EXISTS original_inspiration_id INT DEFAULT NULL;
ALTER TABLE inspirations ADD INDEX IF NOT EXISTS idx_original_inspiration_id (original_inspiration_id);
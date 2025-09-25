-- 创建灵感表
CREATE TABLE IF NOT EXISTS inspirations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  images JSON DEFAULT NULL,
  tags JSON DEFAULT NULL,
  location VARCHAR(200) DEFAULT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_is_public (is_public)
);

-- 创建灵感点赞表
CREATE TABLE IF NOT EXISTS inspiration_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  inspiration_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (inspiration_id) REFERENCES inspirations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_inspiration (user_id, inspiration_id)
);

-- 创建灵感评论表
CREATE TABLE IF NOT EXISTS inspiration_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  inspiration_id INT NOT NULL,
  user_id INT NOT NULL,
  parent_id INT DEFAULT NULL,
  content TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (inspiration_id) REFERENCES inspirations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES inspiration_comments(id) ON DELETE CASCADE,
  INDEX idx_inspiration_id (inspiration_id),
  INDEX idx_user_id (user_id),
  INDEX idx_parent_id (parent_id)
);
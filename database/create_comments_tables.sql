-- 创建评论相关表结构
USE blog;

-- 创建评论表（如果不存在）
CREATE TABLE IF NOT EXISTS comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    article_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_id INT DEFAULT NULL,
    content TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
    likes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_article_comments (article_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_parent (parent_id)
);

-- 创建评论点赞表（如果不存在）
CREATE TABLE IF NOT EXISTS comment_likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    comment_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_comment_like (user_id, comment_id),
    INDEX idx_comment_likes (comment_id),
    INDEX idx_user_likes (user_id)
);

-- 插入一些测试评论数据（可选）
INSERT IGNORE INTO comments (article_id, user_id, content, status) VALUES 
(1, 1, '这是第一条测试评论！', 'approved'),
(1, 1, '这是第二条测试评论，用来测试评论功能。', 'approved'),
(1, 1, '这是一条回复评论', 'approved');

-- 更新第三条评论为第一条的回复
UPDATE comments SET parent_id = 1 WHERE id = 3;

-- 显示创建结果
SELECT 'Comments table created successfully' as status;
SELECT COUNT(*) as comment_count FROM comments;
SELECT COUNT(*) as like_table_exists FROM information_schema.tables WHERE table_schema = 'blog' AND table_name = 'comment_likes';
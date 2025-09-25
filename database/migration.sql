-- 博客数据库迁移脚本
-- 数据库: blog
-- 服务器: 66.42.96.196

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE blog;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- 文章表
CREATE TABLE IF NOT EXISTS articles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    excerpt TEXT,
    content LONGTEXT NOT NULL,
    category VARCHAR(50),
    image VARCHAR(500),
    featured BOOLEAN DEFAULT FALSE,
    status ENUM('draft', 'published') DEFAULT 'draft',
    likes INT DEFAULT 0,
    views INT DEFAULT 0,
    reading_time INT DEFAULT 0,
    author_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_featured (featured),
    INDEX idx_author (author_id),
    INDEX idx_created_at (created_at),
    FULLTEXT idx_search (title, excerpt, content)
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- 文章标签关联表
CREATE TABLE IF NOT EXISTS article_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    article_id INT NOT NULL,
    tag_id INT NOT NULL,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE KEY unique_article_tag (article_id, tag_id)
);

-- 文章点赞表
CREATE TABLE IF NOT EXISTS article_likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    article_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_article_like (user_id, article_id)
);

-- 文章浏览记录表
CREATE TABLE IF NOT EXISTS article_views (
    id INT PRIMARY KEY AUTO_INCREMENT,
    article_id INT NOT NULL,
    user_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_article_views (article_id),
    INDEX idx_created_at (created_at)
);

-- 评论表（为未来扩展准备）
CREATE TABLE IF NOT EXISTS comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    article_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_id INT DEFAULT NULL,
    content TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_article_comments (article_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 插入默认管理员用户
INSERT IGNORE INTO users (username, email, password, avatar) VALUES 
('admin', 'admin@blog.com', '$2b$10$rQZ8kHWiZ8qXRtqvK5Zv4eJ8kHWiZ8qXRtqvK5Zv4eJ8kHWiZ8qXRt', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin');

-- 创建视图：文章详情视图
CREATE OR REPLACE VIEW article_details AS
SELECT 
    a.*,
    u.username as author_name,
    u.avatar as author_avatar,
    u.email as author_email,
    GROUP_CONCAT(t.name) as tags
FROM articles a
LEFT JOIN users u ON a.author_id = u.id
LEFT JOIN article_tags at ON a.id = at.article_id
LEFT JOIN tags t ON at.tag_id = t.id
GROUP BY a.id;

-- 创建存储过程：增加文章浏览量
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS IncrementArticleViews(
    IN p_article_id INT,
    IN p_user_id INT,
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT
)
BEGIN
    -- 插入浏览记录
    INSERT INTO article_views (article_id, user_id, ip_address, user_agent)
    VALUES (p_article_id, p_user_id, p_ip_address, p_user_agent);
    
    -- 更新文章浏览量
    UPDATE articles 
    SET views = views + 1 
    WHERE id = p_article_id;
END //
DELIMITER ;

-- 创建存储过程：切换文章点赞状态
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS ToggleArticleLike(
    IN p_article_id INT,
    IN p_user_id INT,
    OUT p_is_liked BOOLEAN,
    OUT p_total_likes INT
)
BEGIN
    DECLARE like_exists INT DEFAULT 0;
    
    -- 检查是否已点赞
    SELECT COUNT(*) INTO like_exists 
    FROM article_likes 
    WHERE article_id = p_article_id AND user_id = p_user_id;
    
    IF like_exists > 0 THEN
        -- 取消点赞
        DELETE FROM article_likes 
        WHERE article_id = p_article_id AND user_id = p_user_id;
        SET p_is_liked = FALSE;
    ELSE
        -- 添加点赞
        INSERT INTO article_likes (article_id, user_id) 
        VALUES (p_article_id, p_user_id);
        SET p_is_liked = TRUE;
    END IF;
    
    -- 更新文章点赞数
    UPDATE articles 
    SET likes = (SELECT COUNT(*) FROM article_likes WHERE article_id = p_article_id)
    WHERE id = p_article_id;
    
    -- 返回总点赞数
    SELECT likes INTO p_total_likes FROM articles WHERE id = p_article_id;
END //
DELIMITER ;
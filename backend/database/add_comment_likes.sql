-- 添加评论点赞功能
-- 创建评论点赞表
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

-- 为评论表添加点赞数字段
ALTER TABLE comments ADD COLUMN likes INT DEFAULT 0;

-- 创建索引以提高查询性能
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_article_status ON comments(article_id, status);

-- 创建存储过程：切换评论点赞状态
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS ToggleCommentLike(
    IN p_comment_id INT,
    IN p_user_id INT,
    OUT p_is_liked BOOLEAN,
    OUT p_total_likes INT
)
BEGIN
    DECLARE like_exists INT DEFAULT 0;
    
    -- 检查是否已点赞
    SELECT COUNT(*) INTO like_exists 
    FROM comment_likes 
    WHERE comment_id = p_comment_id AND user_id = p_user_id;
    
    IF like_exists > 0 THEN
        -- 取消点赞
        DELETE FROM comment_likes 
        WHERE comment_id = p_comment_id AND user_id = p_user_id;
        SET p_is_liked = FALSE;
    ELSE
        -- 添加点赞
        INSERT INTO comment_likes (comment_id, user_id) 
        VALUES (p_comment_id, p_user_id);
        SET p_is_liked = TRUE;
    END IF;
    
    -- 更新评论点赞数
    UPDATE comments 
    SET likes = (SELECT COUNT(*) FROM comment_likes WHERE comment_id = p_comment_id)
    WHERE id = p_comment_id;
    
    -- 返回总点赞数
    SELECT likes INTO p_total_likes FROM comments WHERE id = p_comment_id;
END //
DELIMITER ;

-- 创建视图：评论详情视图
CREATE OR REPLACE VIEW comment_details AS
SELECT 
    c.*,
    u.username as author_name,
    u.avatar as author_avatar,
    COUNT(cl.id) as total_likes
FROM comments c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN comment_likes cl ON c.id = cl.comment_id
GROUP BY c.id;
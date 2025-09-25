-- 添加文章回收站功能
-- 为 articles 表添加 deleted_at 字段用于软删除
ALTER TABLE articles ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

-- 添加索引以提高查询性能
CREATE INDEX idx_articles_deleted_at ON articles(deleted_at);
CREATE INDEX idx_articles_status_deleted ON articles(status, deleted_at);

-- 更新现有文章的状态（确保没有被删除的文章）
UPDATE articles SET deleted_at = NULL WHERE deleted_at IS NULL;
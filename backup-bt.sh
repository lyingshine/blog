#!/bin/bash

# 宝塔面板博客备份脚本
echo "📦 开始备份博客系统..."

# 设置变量
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/www/backup/blog"
SITE_PATH="/www/wwwroot/blog.lyingshine.top"
DB_NAME="blog_db"
DB_USER="blog_db"
DB_PASS="your_db_password"  # 请修改为实际密码

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份网站文件
echo "📁 备份网站文件..."
tar -czf $BACKUP_DIR/website_$DATE.tar.gz -C $(dirname $SITE_PATH) $(basename $SITE_PATH)

# 备份数据库
echo "🗄️ 备份数据库..."
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/database_$DATE.sql

# 备份上传文件
echo "🖼️ 备份上传文件..."
if [ -d "$SITE_PATH/backend/uploads" ]; then
    tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $SITE_PATH/backend uploads
fi

# 清理旧备份（保留最近7天）
echo "🧹 清理旧备份..."
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

# 显示备份信息
echo "✅ 备份完成！"
echo "📊 备份文件："
ls -lh $BACKUP_DIR/*$DATE*

# 计算备份大小
TOTAL_SIZE=$(du -sh $BACKUP_DIR | cut -f1)
echo "💾 总备份大小: $TOTAL_SIZE"
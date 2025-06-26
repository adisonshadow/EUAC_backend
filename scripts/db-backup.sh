#!/bin/bash

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 从config.json读取数据库连接信息
CONFIG_FILE="$PROJECT_ROOT/config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "错误：找不到配置文件 $CONFIG_FILE"
    exit 1
fi

# 使用jq解析config.json
DB_HOST=$(jq -r '.postgresql.host' "$CONFIG_FILE")
DB_PORT=$(jq -r '.postgresql.port' "$CONFIG_FILE")
DB_USER=$(jq -r '.postgresql.user' "$CONFIG_FILE")
DB_PASSWORD=$(jq -r '.postgresql.password' "$CONFIG_FILE")
DB_NAME=$(jq -r '.postgresql.database' "$CONFIG_FILE")

# 检查必要的配置是否存在
if [ "$DB_HOST" = "null" ] || [ "$DB_PORT" = "null" ] || [ "$DB_USER" = "null" ] || [ "$DB_PASSWORD" = "null" ] || [ "$DB_NAME" = "null" ]; then
    echo "错误：config.json 中缺少必要的数据库配置信息"
    exit 1
fi

# 设置备份目录
BACKUP_DIR="$PROJECT_ROOT/backups/db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# 创建备份目录（如果不存在）
mkdir -p "$BACKUP_DIR"

# 检查是否已经有备份进程在运行
LOCK_FILE="/tmp/uac_db_backup.lock"
if [ -f "$LOCK_FILE" ]; then
    PID=$(cat "$LOCK_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo "备份进程已经在运行中 (PID: $PID)"
        exit 1
    fi
fi

# 创建锁文件
echo $$ > "$LOCK_FILE"

# 执行备份
echo "开始备份数据库..."
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F c -f "$BACKUP_FILE"

# 检查备份是否成功
if [ $? -eq 0 ]; then
    echo "数据库备份成功: $BACKUP_FILE"
    
    # 删除7天前的备份文件
    find "$BACKUP_DIR" -name "backup_*.sql" -type f -mtime +7 -delete
    echo "已删除7天前的备份文件"
else
    echo "数据库备份失败"
fi

# 删除锁文件
rm -f "$LOCK_FILE" 
#!/bin/bash
# 初始化数据库脚本
# chmod +x /Users/yanfang/MOM/UAC/scripts/initdb.sh
# /Users/yanfang/MOM/UAC/scripts/initdb.sh

set -euo pipefail

# 读取配置文件
CONFIG_FILE="$(dirname "$0")/../config.json"
if [ ! -f "$CONFIG_FILE" ]; then
  echo "错误：配置文件 $CONFIG_FILE 不存在"
  exit 1
fi

# 使用jq解析配置文件
DB_HOST=$(jq -r '.postgresql.host' "$CONFIG_FILE")
DB_PORT=$(jq -r '.postgresql.port' "$CONFIG_FILE")
DB_NAME=$(jq -r '.postgresql.database' "$CONFIG_FILE")
DB_USER=$(jq -r '.postgresql.user' "$CONFIG_FILE")
DB_PASS=$(jq -r '.postgresql.password' "$CONFIG_FILE")

# 构建psql命令
PSQL_CMD="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"

# 检查数据库连接
echo "测试数据库连接..."
PGPASSWORD="$DB_PASS" $PSQL_CMD -c "SELECT 1;" || { echo "数据库连接失败"; exit 1; }

# 重置数据库表
echo "开始重置数据库表..."
PGPASSWORD="$DB_PASS" $PSQL_CMD -c "DROP SCHEMA IF EXISTS uac CASCADE; CREATE SCHEMA uac;" || { echo "重置数据库失败"; exit 1; }
echo "数据库重置完成"

# 安装pgcrypto扩展
echo "安装pgcrypto扩展..."
PGPASSWORD="$DB_PASS" $PSQL_CMD -c "CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public;" || { echo "安装pgcrypto扩展失败"; exit 1; }
echo "pgcrypto扩展安装完成"

# 创建数据库结构
echo "开始创建数据库结构..."
PGPASSWORD="$DB_PASS" $PSQL_CMD -f "$(dirname "$0")/schemas.sql" || { echo "创建数据库结构失败"; exit 1; }
echo "数据库结构创建完成"

# 创建超级管理员
echo "创建超级管理员..."
PGPASSWORD="$DB_PASS" $PSQL_CMD -f "$(dirname "$0")/superadmin.sql" || { echo "创建超级管理员失败"; exit 1; }
echo "超级管理员创建完成"

# 如果需要，导入测试数据
if [[ "$*" == *"--with-mock"* ]]; then
    echo "开始导入测试数据..."
    PGPASSWORD="$DB_PASS" $PSQL_CMD -f "$(dirname "$0")/mock_data.sql" || { echo "导入测试数据失败"; exit 1; }
    echo "测试数据导入完成"
fi

echo "数据库操作完成"
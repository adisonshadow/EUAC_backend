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

# 检查PostgreSQL连接
check_db_connection() {
  echo "测试数据库连接..."
  if ! PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\q"; then
    echo "错误：无法连接到数据库"
    exit 1
  fi
}

# 执行SQL文件
execute_sql_file() {
  local file_path="$1"
  echo "执行SQL文件: $file_path"
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file_path"
}

# 主函数
main() {
  check_db_connection
  
  echo "开始重置数据库表..."
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    DROP SCHEMA IF EXISTS uac CASCADE;
    CREATE SCHEMA uac;
  "
  echo "数据库重置完成"

  echo "开始创建数据库结构..."
  # 执行schema创建
  execute_sql_file "$(dirname "$0")/../Documents/UAC_Schema.sql"
  echo "数据库结构创建完成"

  # 如果指定了--with-mock，导入测试数据
  if [ "${1:-}" = "--with-mock" ] || [ "${2:-}" = "--with-mock" ]; then
    echo "开始导入测试数据..."
    execute_sql_file "$(dirname "$0")/../scripts/seed_data.sql"
    echo "测试数据导入完成"
  fi
  
  echo "数据库操作完成"
}

# 执行主函数
main "$@"
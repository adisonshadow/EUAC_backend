const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const sequelize = require('../utils/db');

async function initDatabase(options = {}) {
  const { resetOnly = false } = options;
  const pool = new Pool({
    host: sequelize.config.host,
    port: sequelize.config.port,
    user: sequelize.config.username,
    password: sequelize.config.password,
    database: sequelize.config.database
  });

  try {
    // 删除现有表
    await pool.query(`
      DROP SCHEMA IF EXISTS uac CASCADE;
      CREATE SCHEMA uac;
    `);

    if (!resetOnly) {
      // 读取SQL文件
      const sqlFile = path.join(__dirname, '../../Documents/UAC_Schema.sql');
      const sql = fs.readFileSync(sqlFile, 'utf8');

      // 分割SQL语句并按顺序执行
      const statements = sql
        .split(';')
        .map(statement => statement.trim())
        .filter(statement => statement.length > 0);

      // 按顺序执行SQL语句
      for (const statement of statements) {
        try {
          // 跳过注释
          if (statement.startsWith('--')) continue;
          
          // 执行SQL语句
          await pool.query(statement + ';');
          console.log('执行SQL语句成功:', statement.substring(0, 50) + '...');
        } catch (error) {
          console.error('执行SQL语句失败:', error);
          console.error('失败的SQL语句:', statement);
          throw error;
        }
      }

      // 验证表是否创建成功
      const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'uac'
      `);

      if (tables.rows.length === 0) {
        throw new Error('数据库表创建失败：没有找到任何表');
      }

      console.log('数据库初始化成功，创建了以下表：', tables.rows.map(t => t.table_name).join(', '));
    }
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  } finally {
    // 只在直接运行此文件时关闭连接
    if (require.main === module) {
      await pool.end();
    }
  }
}

// 如果直接运行此文件，则执行初始化
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('数据库初始化完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('数据库初始化失败:', error);
      process.exit(1);
    });
}

module.exports = initDatabase; 
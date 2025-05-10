const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// 读取配置文件
const configPath = path.join(__dirname, '../../config.json');
const configContent = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configContent);

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: config.postgresql.host,
  port: config.postgresql.port,
  database: config.postgresql.database,
  username: config.postgresql.user,
  password: config.postgresql.password,
  schema: 'uac',
  logging: false,
  define: {
    timestamps: true,
    underscored: true
  },
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// 测试数据库连接
sequelize.authenticate()
  .then(() => {
    logger.info('Database connected successfully');
  })
  .catch(err => {
    logger.error('Unable to connect to the database:', err);
    process.exit(-1);
  });

module.exports = sequelize; 
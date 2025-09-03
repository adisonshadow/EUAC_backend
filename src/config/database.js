const { Sequelize } = require('sequelize');
const config = require('../../config.json');

const sequelize = new Sequelize(
  config.postgresql.database,
  config.postgresql.user,
  config.postgresql.password,
  {
    host: config.postgresql.host,
    port: config.postgresql.port,
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      schema: config.postgresql.schema
    },
    pool: {
      max: config.postgresql.max_connections,
      min: 0,
      acquire: config.postgresql.connection_timeout,
      idle: config.postgresql.idle_timeout
    }
  }
);

// 测试数据库连接
sequelize.authenticate()
  .then(() => {
    console.log('✅ Successfully connected to database');
  })
  .catch(err => {
    console.error('❌ Failed to connect to database:', err);
  });

module.exports = sequelize; 
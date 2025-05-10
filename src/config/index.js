const fs = require('fs');
const path = require('path');

// 读取配置文件
const configPath = path.join(__dirname, '../../config.json');
const configContent = fs.readFileSync(configPath, 'utf8');

// 解析JSON
const config = JSON.parse(configContent);

// 获取环境变量
const env = process.env.NODE_ENV || 'development';

module.exports = {
  env,
  api: config.api,
  jwt: {
    secret: env === 'test' ? process.env.TEST_JWT_SECRET : config.api.security.jwtSecret,
    expiresIn: config.api.security.jwtExpiresIn
  },
  logging: config.logging
}; 
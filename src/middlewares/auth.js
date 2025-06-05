const jwt = require('jsonwebtoken');
const config = require('../../config.json');
const logger = require('../utils/logger');

module.exports = async (ctx, next) => {
  const authHeader = ctx.headers.authorization;
  
  if (!authHeader) {
    ctx.status = 401;
    ctx.body = {
      code: 401,
      message: '未提供认证令牌',
      data: null
    };
    return;
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const payload = jwt.verify(token, config.api.security.jwtSecret);
    
    // 确保 payload 包含必要的用户信息
    if (!payload || !payload.user_id) {
      ctx.status = 401;
      ctx.body = {
        code: 401,
        message: '无效的令牌',
        data: null
      };
      return;
    }

    ctx.state.user = payload;
    await next();
  } catch (error) {
    logger.error('Token verification failed', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    ctx.status = 401;
    ctx.body = {
      code: 401,
      message: '无效的令牌',
      data: null
    };
  }
}; 
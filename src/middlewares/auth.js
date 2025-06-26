const jwt = require('jsonwebtoken');
const config = require('../../config.json');
const logger = require('../utils/logger');
const Application = require('../models/application');

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
    // 检查是否通过app参数传递了application_id（第三方系统验证）
    const { app } = ctx.query;
    let jwtSecret = config.api.security.jwtSecret;
    
    if (app) {
      // 验证application_id并获取SSO salt
      const application = await Application.findOne({
        where: {
          application_id: app,
          status: 'ACTIVE',
          sso_enabled: true
        }
      });

      if (application && application.sso_config && application.sso_config.salt) {
        jwtSecret = application.sso_config.salt;
        logger.debug('Using SSO salt for token verification', { application_id: app, salt: application.sso_config.salt });
      }
    }
    
    const payload = jwt.verify(token, jwtSecret);
    
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
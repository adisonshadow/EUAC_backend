const { logger } = require('../utils/logger');

// 错误类型映射
const ERROR_TYPES = {
  ValidationError: 400,
  UnauthorizedError: 401,
  ForbiddenError: 403,
  NotFoundError: 404,
  ConflictError: 409,
  InternalServerError: 500,
  CustomValidationError: 400,
  SequelizeValidationError: 400,
  SequelizeUniqueConstraintError: 409
};

// 安全错误消息
const SAFE_ERROR_MESSAGES = {
  400: '请求参数错误',
  401: '未授权访问',
  403: '禁止访问',
  404: '资源不存在',
  409: '资源冲突',
  500: '服务器内部错误'
};

const errorHandler = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    // 如果err是undefined或null，创建一个新的错误对象
    if (!err) {
      err = new Error('Unknown error');
      err.status = 500;
      err.name = 'InternalServerError';
    }
    
    // 确保err对象存在
    if (!(err instanceof Error)) {
      const message = err.message || 'Unknown error';
      const status = err.status || 500;
      const name = err.name || 'InternalServerError';
      const newErr = new Error(message);
      newErr.status = status;
      newErr.name = name;
      newErr.details = err.details; // 保留原始细节
      err = newErr;
    }
    
    // 确定错误状态码
    const status = err.status || ERROR_TYPES[err.name] || 500;
    
    // 记录错误信息
    logger.error('Error occurred', {
      name: err.name || 'Error',
      message: err.message || 'Internal Server Error',
      stack: err.stack,
      request: {
        method: ctx.method,
        path: ctx.path,
        query: ctx.query,
        body: ctx.request.body,
        headers: ctx.headers,
        ip: ctx.ip,
        user: ctx.state.user || null
      }
    });

    // 统一错误响应格式
    const errorResponse = {
      code: status,
      message: process.env.NODE_ENV === 'production' 
        ? SAFE_ERROR_MESSAGES[status] || '服务器错误'
        : err.message || 'Internal Server Error',
      data: null
    };

    // 开发环境附加详情
    if (['development', 'test'].includes(process.env.NODE_ENV)) {
      errorResponse.stack = err.stack;
      errorResponse.name = err.name;
      errorResponse.details = err.details || null;
      
      // 如果是 Sequelize 错误，添加更多详细信息
      if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        errorResponse.errors = err.errors.map(e => ({
          message: e.message,
          type: e.type,
          path: e.path,
          value: e.value
        }));
      }
    }

    // 设置响应状态码和类型
    ctx.status = status;
    ctx.set('Content-Type', 'application/json; charset=utf-8');
    ctx.body = errorResponse;

    // 记录错误响应
    logger.debug('Error response', {
      status,
      message: errorResponse.message,
      path: ctx.path,
      details: errorResponse.details,
      stack: errorResponse.stack
    });
  }
};

module.exports = errorHandler;
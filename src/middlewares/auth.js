const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = async (ctx, next) => {
  const authHeader = ctx.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ctx.status = 401;
    ctx.body = { code: 401, message: '未授权', data: null };
    return;
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    ctx.state.user = payload;
    await next();
  } catch (err) {
    ctx.status = 401;
    ctx.body = { code: 401, message: '未授权', data: null };
  }
}; 
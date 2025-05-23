const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const multer = require('koa-multer');
const cors = require('@koa/cors');
const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');
const routes = require('./routes');
const { koaSwagger } = require('koa2-swagger-ui');
const fs = require('fs');
const path = require('path');

// 读取 swagger.json 文件
let swaggerSpec;
try {
  swaggerSpec = JSON.parse(fs.readFileSync(path.join(__dirname, '../swagger.json'), 'utf8'));
  logger.info('Swagger 文档加载成功');
} catch (error) {
  logger.error('Swagger 文档加载失败', { error: error.message });
  process.exit(1);
}

// 创建应用实例
const app = new Koa();

// 错误处理中间件（放在最前面）
app.use(errorHandler);

// 中间件配置
app.use(cors());
app.use(bodyParser());

// 文件上传中间件配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// 将 multer 中间件添加到路由中
app.use(upload.single('file'));

// Swagger UI 配置
try {
  app.use(
    koaSwagger({
      routePrefix: '/swagger',
      swaggerOptions: {
        spec: swaggerSpec,
      },
    }),
  );
  logger.info('Swagger UI 配置成功');
} catch (error) {
  logger.error('Swagger UI 配置失败', { error: error.message });
  process.exit(1);
}

// 添加 OpenAPI JSON 路由
app.use(async (ctx, next) => {
  if (ctx.path === '/swagger.json') {
    ctx.type = 'application/json';
    ctx.body = swaggerSpec;
    return;
  }
  await next();
});

// 添加请求日志
app.use(async (ctx, next) => {
  const start = Date.now();
  try {
    await next();
    const ms = Date.now() - start;
    logger.info('Request completed', {
      method: ctx.method,
      url: ctx.url,
      status: ctx.status,
      duration: `${ms}ms`
    });
  } catch (error) {
    const ms = Date.now() - start;
    logger.error('Request error', {
      method: ctx.method,
      url: ctx.url,
      status: ctx.status,
      duration: `${ms}ms`,
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
});

// 路由配置
app.use(routes.routes());
app.use(routes.allowedMethods());

// 检查服务器是否已启动
let server = null;

// 如果不是测试环境，则启动服务器
if (process.env.NODE_ENV !== 'test') {
  const PORT = config.api.port || 3000;
  try {
    server = app.listen(PORT, () => {
      logger.info('Server is running', { port: PORT });
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('服务器启动失败', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
} else {
  // 在测试环境中，创建一个服务器实例并导出
  const PORT = config.api.port || 3000;
  try {
    server = app.listen(PORT);
    if (!server) {
      logger.error('服务器启动失败');
      process.exit(1);
    }
  } catch (error) {
    logger.error('测试服务器启动失败', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// 添加错误处理
server.on('error', (error) => {
  logger.error('服务器错误', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// 添加未捕获的异常处理
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// 添加未处理的 Promise 拒绝处理
process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝', {
    reason: reason,
    promise: promise
  });
  process.exit(1);
});

module.exports = app;
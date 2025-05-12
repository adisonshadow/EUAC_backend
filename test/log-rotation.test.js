const fs = require('fs');
const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');
const config = require('../config.json');

describe('日志轮转测试', () => {
  let logger;
  const logDir = path.dirname(config.logging.file);

  beforeAll(() => {
    // 确保日志目录存在
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // 配置日志记录器
    logger = winston.createLogger({
      level: config.logging.level,
      format: winston.format.json(),
      transports: [
        new winston.transports.DailyRotateFile({
          filename: path.join(logDir, 'app-%DATE%.log'),
          datePattern: 'YYYY-MM-DD-HH-mm-ss',
          maxSize: '500b', // 降低大小限制以更快触发轮转
          maxFiles: config.logging.rotation.maxFiles,
          zippedArchive: config.logging.rotation.zippedArchive,
          createSymlink: true,
          symlinkName: 'app.log'
        })
      ]
    });
  });

  afterAll(() => {
    // 清理测试日志文件
    if (fs.existsSync(logDir)) {
      fs.rmSync(logDir, { recursive: true, force: true });
    }
  });

  test('日志文件应该在30秒后轮转', async () => {
    // 生成足够大的日志内容以触发轮转
    const largeMessage = 'x'.repeat(400); // 400字节
    logger.info(largeMessage);

    // 等待35秒（比轮转间隔多5秒）
    await new Promise(resolve => setTimeout(resolve, 35000));

    // 检查是否创建了新的日志文件
    const files = fs.readdirSync(logDir);
    const logFiles = files.filter(file => file.startsWith('app-') && file.endsWith('.log'));
    
    console.log('日志文件列表:', logFiles);
    expect(logFiles.length).toBeGreaterThan(1);
  }, 40000); // 增加超时时间到40秒

  test('轮转后的日志文件应该被压缩', async () => {
    // 等待文件压缩完成
    await new Promise(resolve => setTimeout(resolve, 5000));

    const files = fs.readdirSync(logDir);
    const gzFiles = files.filter(file => file.endsWith('.gz'));
    
    console.log('压缩文件列表:', gzFiles);
    expect(gzFiles.length).toBeGreaterThan(0);
  }, 10000); // 增加超时时间到10秒

  test('日志文件大小不应超过500字节', async () => {
    const files = fs.readdirSync(logDir);
    const logFiles = files.filter(file => file.startsWith('app-') && file.endsWith('.log'));
    
    for (const file of logFiles) {
      const stats = fs.statSync(path.join(logDir, file));
      console.log(`文件 ${file} 大小: ${stats.size} 字节`);
      expect(stats.size).toBeLessThanOrEqual(500);
    }
  }, 10000); // 增加超时时间到10秒
}); 
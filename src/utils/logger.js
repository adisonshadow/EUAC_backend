const winston = require('winston');
const fs = require('fs');
const path = require('path');
const config = require('../../config.json');
require('winston-daily-rotate-file');

// 确保日志目录存在
const logDir = path.dirname(config.logging.file);
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// 自定义日志格式
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
);

// 创建 logger 实例
const logger = winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    transports: [
        // 文件日志，使用日志轮转
        new winston.transports.DailyRotateFile({
            filename: path.join(logDir, 'app-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',           // 单个文件最大 20MB
            maxFiles: '14d',          // 保留 14 天的日志
            zippedArchive: true,      // 压缩旧日志
            format: logFormat
        }),
        // 错误日志单独存储
        new winston.transports.DailyRotateFile({
            filename: path.join(logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d',          // 错误日志保留 30 天
            zippedArchive: true,
            level: 'error',
            format: logFormat
        })
    ]
});

// 添加控制台输出
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// 处理未捕获的异常
logger.exceptions.handle(
    new winston.transports.DailyRotateFile({
        filename: path.join(logDir, 'exceptions-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        zippedArchive: true
    })
);

// 处理未处理的 Promise 拒绝
logger.rejections.handle(
    new winston.transports.DailyRotateFile({
        filename: path.join(logDir, 'rejections-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        zippedArchive: true
    })
);

module.exports = logger; 
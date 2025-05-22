const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const config = require('../config');

// 确保上传目录存在
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 生成缩略图
async function generateThumbnail(filePath, width = 300, height = 300, mode = 'cover') {
  const thumbnailPath = filePath.replace(/\.[^/.]+$/, '') + '_thumb.webp';
  
  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();
    
    // 计算缩放比例
    const scale = Math.min(width / metadata.width, height / metadata.height);
    const newWidth = Math.round(metadata.width * scale);
    const newHeight = Math.round(metadata.height * scale);
    
    if (mode === 'cover') {
      // 裁剪模式
      await image
        .resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 80 })
        .toFile(thumbnailPath);
    } else {
      // 包含模式
      await image
        .resize(newWidth, newHeight)
        .webp({ quality: 80 })
        .toFile(thumbnailPath);
    }
    
    return thumbnailPath;
  } catch (error) {
    logger.error('生成缩略图失败', { error: error.message });
    return null;
  }
}

// 上传文件
exports.uploadFile = async (ctx) => {
  try {
    const file = ctx.req.file;
    if (!file) {
      ctx.status = 400;
      ctx.body = { error: '没有上传文件' };
      return;
    }

    const fileType = ctx.query.type || config.upload.defaultType;
    const typeConfig = config.upload.types[fileType];

    if (!typeConfig) {
      ctx.status = 400;
      ctx.body = { error: '不支持的文件类型' };
      return;
    }

    // 检查文件类型
    if (!typeConfig.mimeTypes.includes(file.mimetype)) {
      ctx.status = 400;
      ctx.body = { error: '不支持的文件类型' };
      return;
    }

    // 检查文件大小
    if (file.size > typeConfig.maxSize) {
      ctx.status = 400;
      ctx.body = { error: '文件大小超过限制' };
      return;
    }

    // 生成文件ID
    const fileId = uuidv4();
    const fileExt = path.extname(file.originalname);
    const fileName = `${fileId}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    // 移动文件到目标目录
    fs.renameSync(file.path, filePath);

    // 如果是图片类型，生成缩略图
    let thumbnailPath = null;
    if (fileType === 'image') {
      thumbnailPath = await generateThumbnail(filePath);
    }

    ctx.status = 200;
    ctx.body = {
      id: fileId,
      type: fileType,
      url: `${config.api.baseUrl}/api/v1/uploads/${fileType === 'image' ? 'images' : 'files'}/${fileId}`,
      thumbnail_url: thumbnailPath ? `${config.api.baseUrl}/api/v1/uploads/images/${fileId}?thumb=true` : null,
      size: file.size,
      mime_type: file.mimetype,
      extension: fileExt
    };
  } catch (error) {
    logger.error('上传文件失败', { error: error.message });
    ctx.status = 500;
    ctx.body = { error: '上传文件失败' };
  }
};

// 获取图片
exports.getImage = async (ctx) => {
  try {
    const { file_id } = ctx.params;
    const { thumb, width, height, mode } = ctx.query;
    
    // 查找文件
    const files = fs.readdirSync(uploadDir);
    const file = files.find(f => f.startsWith(file_id));
    
    if (!file) {
      ctx.status = 404;
      ctx.body = { error: '文件不存在' };
      return;
    }

    const filePath = path.join(uploadDir, file);
    
    // 如果需要缩略图
    if (thumb === 'true') {
      const thumbnailPath = await generateThumbnail(
        filePath,
        parseInt(width) || 300,
        parseInt(height) || 300,
        mode || 'cover'
      );
      
      if (thumbnailPath) {
        ctx.type = 'image/webp';
        ctx.body = fs.createReadStream(thumbnailPath);
        return;
      }
    }

    // 返回原图
    ctx.type = path.extname(file).slice(1);
    ctx.body = fs.createReadStream(filePath);
  } catch (error) {
    logger.error('获取图片失败', { error: error.message });
    ctx.status = 500;
    ctx.body = { error: '获取图片失败' };
  }
};

// 获取文件
exports.getFile = async (ctx) => {
  try {
    const { file_id } = ctx.params;
    
    // 查找文件
    const files = fs.readdirSync(uploadDir);
    const file = files.find(f => f.startsWith(file_id));
    
    if (!file) {
      ctx.status = 404;
      ctx.body = { error: '文件不存在' };
      return;
    }

    const filePath = path.join(uploadDir, file);
    
    // 返回文件
    ctx.type = path.extname(file).slice(1);
    ctx.body = fs.createReadStream(filePath);
  } catch (error) {
    logger.error('获取文件失败', { error: error.message });
    ctx.status = 500;
    ctx.body = { error: '获取文件失败' };
  }
}; 
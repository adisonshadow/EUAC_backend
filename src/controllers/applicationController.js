const { Application } = require('../models');
const { Op } = require('sequelize');
const { validate: isUuid } = require('uuid');
const logger = require('../utils/logger');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../../config.json');

class ApplicationController {
  // 创建应用端
  static async create(ctx) {
    try {
      const { name, code, status = 'ACTIVE', sso_enabled = false, sso_config, description } = ctx.request.body;

      // 验证必填字段
      if (!name || !code) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '应用端名称和编码不能为空',
          data: null
        };
        return;
      }

      // 验证字段长度
      if (name.length > 100) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '应用端名称不能超过100个字符',
          data: null
        };
        return;
      }

      if (code.length > 50) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '应用端编码不能超过50个字符',
          data: null
        };
        return;
      }

      // 验证状态值
      if (status && !['ACTIVE', 'DISABLED', 'ARCHIVED'].includes(status)) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '无效的状态值',
          data: null
        };
        return;
      }

      const application = await Application.create({
        name,
        code,
        status,
        sso_enabled,
        sso_config,
        description
      });

      ctx.status = 201;
      ctx.body = {
        code: 201,
        message: '应用端创建成功',
        data: application
      };
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '应用端编码已存在',
          data: null
        };
      } else {
        logger.error('创建应用端失败', { 
          error: error.message,
          body: ctx.request.body 
        });
        ctx.status = 500;
        ctx.body = {
          code: 500,
          message: '创建应用端失败',
          error: error.message
        };
      }
    }
  }

  // 获取应用端列表
  static async list(ctx) {
    try {
      const { page = 1, size = 10, status, search } = ctx.query;
      const where = {};
      
      if (status) {
        where.status = status;
      }
      
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Application.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: parseInt(size),
        offset: (parseInt(page) - 1) * parseInt(size),
      });

      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          total: count,
          items: rows,
          current: parseInt(page),
          size: parseInt(size)
        }
      };
    } catch (error) {
      logger.error('获取应用端列表失败', { error: error.message });
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '获取应用端列表失败',
        error: error.message
      };
    }
  }

  // 获取应用端详情
  static async getById(ctx) {
    try {
      const { id } = ctx.params;

      // UUID 校验
      if (!isUuid(id)) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '应用端不存在',
          data: null
        };
        return;
      }

      const application = await Application.findByPk(id);
      if (!application) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '应用端不存在',
          data: null
        };
        return;
      }

      ctx.body = {
        code: 200,
        message: 'success',
        data: application
      };
    } catch (error) {
      logger.error('获取应用端详情失败', { error: error.message });
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '获取应用端详情失败',
        error: error.message
      };
    }
  }

  // 更新应用端
  static async update(ctx) {
    try {
      const { id } = ctx.params;
      const { 
        name, 
        code, 
        status, 
        sso_enabled, 
        sso_config, 
        api_enabled,
        api_connect_config,
        api_data_scope,
        description 
      } = ctx.request.body;

      // UUID 校验
      if (!isUuid(id)) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '应用端不存在',
          data: null
        };
        return;
      }

      // 验证字段长度
      if (name && name.length > 100) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '应用端名称不能超过100个字符',
          data: null
        };
        return;
      }

      if (code && code.length > 50) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '应用端编码不能超过50个字符',
          data: null
        };
        return;
      }

      // 验证状态值
      if (status && !['ACTIVE', 'DISABLED', 'ARCHIVED'].includes(status)) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '无效的状态值',
          data: null
        };
        return;
      }

      const application = await Application.findByPk(id);
      if (!application) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '应用端不存在',
          data: null
        };
        return;
      }

      await application.update({
        name,
        code,
        status,
        sso_enabled,
        sso_config,
        api_enabled,
        api_connect_config,
        api_data_scope,
        description
      });

      ctx.body = {
        code: 200,
        message: 'success',
        data: application
      };
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '应用端编码已存在',
          data: null
        };
      } else {
        logger.error('更新应用端失败', { error: error.message });
        ctx.status = 500;
        ctx.body = {
          code: 500,
          message: '更新应用端失败',
          error: error.message
        };
      }
    }
  }

  // 删除应用端
  static async delete(ctx) {
    try {
      const { id } = ctx.params;

      // UUID 校验
      if (!isUuid(id)) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '应用端不存在',
          data: null
        };
        return;
      }

      const application = await Application.findByPk(id);
      if (!application) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '应用端不存在',
          data: null
        };
        return;
      }

      await application.destroy();
      ctx.body = {
        code: 200,
        message: 'success',
        data: null
      };
    } catch (error) {
      logger.error('删除应用端失败', { error: error.message });
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '删除应用端失败',
        error: error.message
      };
    }
  }

  // 生成应用密钥
  static async generateSecret(ctx) {
    try {
      const { id } = ctx.params;
      const { salt } = ctx.request.body;

      // UUID 校验
      if (!isUuid(id)) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '应用不存在',
          data: null
        };
        return;
      }

      // 验证salt
      if (!salt) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: 'salt不能为空',
          data: null
        };
        return;
      }

      const application = await Application.findByPk(id);
      if (!application) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '应用不存在',
          data: null
        };
        return;
      }

      // 生成app_secret
      const app_secret = crypto
        .createHmac('sha256', salt)
        .update(id)
        .digest('hex');

      // 更新应用的api_connect_config
      const api_connect_config = {
        app_secret,
        salt
      };

      await application.update({
        api_connect_config
      });

      ctx.body = {
        code: 200,
        message: '生成成功',
        data: {
          app_secret
        }
      };
    } catch (error) {
      logger.error('生成应用密钥失败', { error: error.message });
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '生成应用密钥失败',
        error: error.message
      };
    }
  }

  // 获取应用Token
  static async getToken(ctx) {
    try {
      const { application_id, app_secret } = ctx.request.body;

      // 验证参数
      if (!application_id || !app_secret) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: 'application_id和app_secret不能为空',
          data: null
        };
        return;
      }

      // UUID 校验
      if (!isUuid(application_id)) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '无效的application_id',
          data: null
        };
        return;
      }

      const application = await Application.findByPk(application_id);
      if (!application) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '应用不存在',
          data: null
        };
        return;
      }

      // 验证app_secret
      const stored_config = application.api_connect_config;
      if (!stored_config || stored_config.app_secret !== app_secret) {
        ctx.status = 401;
        ctx.body = {
          code: 401,
          message: '无效的app_secret',
          data: null
        };
        return;
      }

      // 生成JWT token
      const token = jwt.sign(
        {
          application_id,
          type: 'application'
        },
        config.api.security.jwtSecret,
        {
          expiresIn: config.api.security.jwtExpiresIn
        }
      );

      ctx.body = {
        code: 200,
        message: '获取成功',
        data: {
          token
        }
      };
    } catch (error) {
      logger.error('获取应用Token失败', { error: error.message });
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '获取应用Token失败',
        error: error.message
      };
    }
  }

  // 获取SSO应用信息
  static async getSsoInfo(ctx) {
    try {
      const { id } = ctx.params;

      // UUID 校验
      if (!isUuid(id)) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: "应用端不存在",
          data: null
        };
        return;
      }

      const application = await Application.findByPk(id);
      if (!application) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: "应用端不存在",
          data: null
        };
        return;
      }

      // 检查SSO是否启用
      if (!application.sso_enabled) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: "该应用未启用SSO",
          data: null
        };
        return;
      }

      // 检查SSO配置是否存在
      if (!application.sso_config || !application.sso_config.salt) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: "SSO配置不完整",
          data: null
        };
        return;
      }

      // 生成当前时间戳
      const currentTimestamp = Date.now().toString();
      
      // 使用bcrypt加密时间戳
      const bcrypt = require("bcryptjs");
      // const secret = await bcrypt.hash(currentTimestamp, 10);

      // 使用SSO配置中的salt和当前时间戳生成secret
      const secret = await bcrypt.hash(currentTimestamp + application.sso_config.salt, 10);

      // 构建SSO配置信息
      const ssoConfig = {
        currentTimestamp,
        secret,
        protocol: application.sso_config.protocol || "OAuth",
        redirect_uri: application.sso_config.redirect_uri
      };

      // 构建返回数据
      const ssoInfo = {
        application_id: application.application_id,
        name: application.name,
        code: application.code,
        status: application.status,
        sso_enabled: application.sso_enabled,
        sso_config: ssoConfig,
        description: application.description,
        created_at: application.created_at,
        updated_at: application.updated_at
      };

      ctx.body = {
        code: 200,
        message: "success",
        data: ssoInfo
      };
    } catch (error) {
      logger.error("获取SSO应用信息失败", { error: error.message });
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: "获取SSO应用信息失败",
        error: error.message
      };
    }
  }
}

module.exports = ApplicationController; 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const config = require('../../config.json');
const logger = require('../utils/logger');
const User = require('../models/user');
const Captcha = require('../models/captcha');
const LoginAttempt = require('../models/loginAttempt');
const RefreshToken = require('../models/refreshToken');
const { CustomValidationError, UnauthorizedError, ValidationError: _ValidationError, AuthenticationError: _AuthenticationError } = require('../utils/errors');
const Application = require('../models/application');
 
class AuthController {
  /**
   * 用户登录 
   */
  static async login(ctx) {
    const { username, password, captcha_data, application_id } = ctx.request.body;
    const captcha_id = captcha_data?.captcha_id;

    try {
      logger.debug('User login attempt', { username, application_id });
      
      if (!username || !password) {
        const error = new CustomValidationError('用户名和密码不能为空');
        error.status = 400;
        throw error;
      }

      // 检查是否需要验证码
      if (config.api.loginVerify.enabled) {
        // 如果没有提供验证码ID，返回需要验证码的响应
        if (!captcha_id) {
          ctx.status = 202;
          ctx.body = {
            code: 202,
            message: '需要验证码',
            data: {
              need_captcha: true
            }
          };
          return;
        }

        // 验证验证码
        const captcha = await Captcha.findOne({
          where: {
            captcha_id,
            status: 'USED',
            verified_at: {
              [Op.not]: null
            }
          }
        });

        if (!captcha) {
          ctx.status = 400;
          ctx.body = {
            code: 400,
            message: '验证码无效或未验证',
            data: null
          };
          return;
        }

        // 验证通过后删除验证码记录
        await captcha.destroy();
        logger.debug('Captcha record deleted after successful verification', { captcha_id });
      }

      // 检查登录限制
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // 先查找用户
      const user = await User.findOne({
        where: { username },
        attributes: ['user_id', 'username', 'password_hash', 'status', 'deleted_at'],
        paranoid: false  // 包括已删除的记录
      });

      // 如果用户存在，检查登录限制
      if (user) {
        const recentAttempts = await LoginAttempt.count({
          where: {
            user_id: user.user_id,
            attempt_time: {
              [Op.gte]: oneHourAgo
            },
            success: false
          }
        });

        if (recentAttempts >= 5) {
          const nextAttemptTime = new Date(Date.now() + 60 * 60 * 1000);
          ctx.status = 429;
          ctx.body = {
            code: 429,
            message: '登录失败次数过多，请一小时后重试',
            data: {
              next_attempt_time: nextAttemptTime.toISOString()
            }
          };
          return;
        }
      }

      // 记录登录尝试
      const loginAttempt = {
        ip_address: ctx.ip,
        user_agent: ctx.headers['user-agent'],
        success: false
      };

      if (user) {
        loginAttempt.user_id = user.user_id;
      }

      await LoginAttempt.create(loginAttempt);

      if (!user) {
        const error = new UnauthorizedError('用户名或密码错误');
        error.status = 400;
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: error.message,
          data: null
        };
        return;
      }

      // 检查用户是否被软删除
      if (user.deleted_at) {
        const error = new UnauthorizedError('用户已经被删除');
        error.status = 400;
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: error.message,
          data: null
        };
        return;
      }

      if (user.status !== 'ACTIVE') {
        const error = new UnauthorizedError('用户已被禁用');
        error.status = 403;
        ctx.status = 403;
        ctx.body = {
          code: 403,
          message: error.message,
          data: null
        };
        return;
      }

      // 验证密码
      const isValid = await bcrypt.compare(password, user.password_hash);
      logger.debug('Password validation', { isValid });

      // 更新登录尝试的成功状态
      if (isValid) {
        await LoginAttempt.update(
          { success: true },
          {
            where: {
              user_id: user.user_id,
              ip_address: ctx.ip,
              success: false
            },
            order: [['created_at', 'DESC']],
            limit: 1
          }
        );
      }

      if (!isValid) {
        const error = new UnauthorizedError('用户名或密码错误');
        error.status = 401;
        ctx.status = 401;
        ctx.body = {
          code: 401,
          message: error.message,
          data: null
        };
        return;
      }

      logger.debug('User logged in successfully', { username });

      // 如果提供了 application_id，获取应用的 SSO 配置
      let jwtSecret = config.api.security.jwtSecret;
      let application = null;
      
      if (application_id) {
        application = await Application.findOne({
          where: {
            application_id,
            status: 'ACTIVE',
            sso_enabled: true
          }
        });

        if (application && application.sso_config && application.sso_config.salt) {
          jwtSecret = application.sso_config.salt;
          logger.debug('Using SSO salt as JWT secret', { application_id, salt: application.sso_config.salt });
        }
      }

      // 生成访问令牌
      const token = jwt.sign(
        { user_id: user.user_id, username: user.username },
        jwtSecret,
        { expiresIn: config.api.security.jwtExpiresIn }
      );
      
      // 生成刷新令牌
      const refreshToken = jwt.sign(
        { user_id: user.user_id },
        jwtSecret,
        { expiresIn: '7d' }
      );

      // 保存刷新令牌到数据库
      await RefreshToken.create({
        user_id: user.user_id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
        status: 'ACTIVE'
      });

      // 准备返回数据
      const responseData = {
        token: token,
        refresh_token: refreshToken,
        expires_in: config.api.security.jwtExpiresIn,
        user_id: user.user_id
      };

      // 如果找到了应用，添加SSO配置到响应中
      if (application && application.sso_config) {
        responseData.sso = {
          application_id: application.application_id,
          application_name: application.name,
          application_code: application.code,
          sso_config: application.sso_config
        };
      }

      // 登录成功
      ctx.status = 200;
      ctx.body = {
        code: 200,
        message: 'success',
        data: responseData
      };
    } catch (error) {
      logger.error('Error during login', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // 确保错误对象有正确的属性
      if (!error.status) {
        error.status = 500;
      }
      
      throw error;
    }
  }

  /**
   * 刷新令牌
   */
  static async refreshToken(ctx) {
    const { refresh_token, app } = ctx.request.body;

    try {
      logger.debug('Refreshing token', { refresh_token, app });

      if (!refresh_token) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '刷新令牌不能为空',
          data: null
        };
        return;
      }

      // 检查是否通过app参数传递了application_id（第三方系统验证）
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

        if (!application || !application.sso_config || !application.sso_config.salt) {
          ctx.status = 400;
          ctx.body = {
            code: 400,
            message: '无效的应用ID或SSO配置',
            data: null
          };
          return;
        }

        jwtSecret = application.sso_config.salt;
        logger.debug('Using SSO salt for token refresh', { application_id: app, salt: application.sso_config.salt });
      }

      // 查找刷新令牌
      const tokenRecord = await RefreshToken.findOne({
        where: {
          token: refresh_token,
          status: 'ACTIVE',
          expires_at: {
            [Op.gt]: new Date()
          }
        }
      });

      if (!tokenRecord) {
        ctx.status = 401;
        ctx.body = {
          code: 401,
          message: '刷新令牌无效或已过期',
          data: null
        };
        return;
      }

      // 获取用户信息
      const user = await User.findOne({
        where: { user_id: tokenRecord.user_id },
        attributes: ['user_id', 'username', 'status']
      });

      if (!user || user.status !== 'ACTIVE') {
        ctx.status = 401;
        ctx.body = {
          code: 401,
          message: '用户不存在或已被禁用',
          data: null
        };
        return;
      }

      // 生成新的访问令牌
      const token = jwt.sign(
        { user_id: user.user_id, username: user.username },
        jwtSecret,
        { expiresIn: config.api.security.jwtExpiresIn }
      );

      // 生成新的刷新令牌
      const newRefreshToken = jwt.sign(
        { user_id: user.user_id },
        jwtSecret,
        { expiresIn: '7d' }
      );

      // 更新刷新令牌记录
      await tokenRecord.update({
        token: newRefreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
        status: 'ACTIVE'
      });

      ctx.status = 200;
      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          token,
          refresh_token: newRefreshToken,
          expires_in: config.api.security.jwtExpiresIn
        }
      };
    } catch (error) {
      logger.error('Error refreshing token', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误',
        data: null
      };
    }
  }

  /**
   * 用户登出
   */
  static async logout(ctx) {
    try {
      const { refresh_token } = ctx.request.body;

      if (refresh_token) {
        // 使刷新令牌失效
        await RefreshToken.update(
          { status: 'REVOKED' },
          {
            where: {
              token: refresh_token,
              status: 'ACTIVE'
            }
          }
        );
      }

      ctx.body = {
        code: 200,
        message: '登出成功',
        data: null
      };
    } catch (error) {
      logger.error('登出失败', { error: error.message });
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '登出失败',
        error: error.message
      };
    }
  }

  // 生成验证码
  static async getCaptcha(ctx) {
    // 生成验证码逻辑（示例）
    const captcha = await Captcha.create({
      bg_url: 'https://example.com/bg.jpg',
      puzzle_url: 'https://example.com/puzzle.jpg',
      target_x: 100,
      target_y: 100,
      expires_at: new Date(Date.now() + 5 * 60 * 1000) // 5分钟过期
    });

    ctx.body = {
      code: 200,
      message: '验证码生成成功',
      data: {
        captcha_id: captcha.captcha_id,
        bg_url: captcha.bg_url,
        puzzle_url: captcha.puzzle_url
      }
    };
  }

  /**
   * 检查用户登录状态
   */
  static async checkAuth(ctx) {
    try {
      logger.debug('Checking auth status', { user: ctx.state.user });
      
      // 从 ctx.state.user 中获取用户信息（由 auth 中间件注入）
      const user = await User.findOne({
        where: { 
          user_id: ctx.state.user.user_id,
          status: 'ACTIVE'
        },
        attributes: ['user_id', 'username', 'name', 'avatar', 'gender', 'email', 'phone', 'status', 'department_id']
      });

      if (!user) {
        logger.warn('User not found or DISABLED', { user_id: ctx.state.user.user_id });
        ctx.status = 401;
        ctx.body = {
          code: 401,
          message: '用户不存在或已被禁用',
          data: null
        };
        return;
      }

      ctx.status = 200;
      ctx.body = {
        code: 200,
        message: 'success',
        data: user
      };
    } catch (error) {
      logger.error('Error checking auth status', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        user: ctx.state.user
      });
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误',
        data: null
      };
    }
  }
}

module.exports = AuthController; 
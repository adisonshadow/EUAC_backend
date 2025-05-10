const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UniqueConstraintError, Op } = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');
const { User, LoginAttempt, OperationLog, RefreshToken, Department, Role } = require('../models');

// 自定义错误类
class CustomValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnauthorizedError';
    this.status = 401;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

class UserController {
  // 创建用户
  static async create(ctx) {
    try {
      logger.debug('Creating user', { body: ctx.request.body });

      // 参数验证
      if (!ctx.request.body.username || !ctx.request.body.password) {
        throw new CustomValidationError('用户名和密码不能为空');
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(ctx.request.body.password, salt);
      
      const user = await User.create({
        username: ctx.request.body.username,
        password_hash: hashedPassword,
        department_id: ctx.request.body.department_id
      });

      logger.debug('User created successfully', { user_id: user.user_id });

      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          user_id: user.user_id,
          username: user.username,
          created_at: user.createdAt
        }
      };
    } catch (error) {
      logger.error('Error creating user', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      if (error instanceof UniqueConstraintError) {
        throw new CustomValidationError('用户名已存在');
      }

      throw error;
    }
  }

  // 更新用户信息
  static async update(ctx) {
    const { user_id } = ctx.params;
    const updateData = ctx.request.body;

    try {
      logger.debug('Updating user', { user_id, updateData });
      
      // 检查用户是否存在
      const user = await User.findOne({ where: { user_id: user_id } });
      if (!user) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '用户不存在',
          data: null
        };
        return;
      }

      // 记录旧数据用于日志
      const oldData = {
        email: user.email,
        phone: user.phone,
        status: user.status
      };

      await user.update(updateData);
      logger.debug('User updated successfully', { user_id });

      // 重新获取更新后的用户数据
      const updatedUser = await User.findOne({ where: { user_id: user_id } });

      ctx.status = 200;
      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          user_id: updatedUser.user_id,
          username: updatedUser.username,
          email: updatedUser.email,
          phone: updatedUser.phone,
          status: updatedUser.status,
          department_id: updatedUser.department_id,
          updated_at: updatedUser.updatedAt
        }
      };

      // 记录操作日志
      try {
        await OperationLog.create({
          user_id: user_id, // 使用被更新的用户ID
          operation_type: 'UPDATE',
          resource_type: 'user',
          resource_id: user_id,
          old_data: oldData,
          new_data: {
            email: updatedUser.email,
            phone: updatedUser.phone,
            status: updatedUser.status
          },
          status: 'SUCCESS'
        });
      } catch (logError) {
        // 如果记录日志失败，只记录错误但不影响主流程
        logger.error('Failed to create operation log', {
          error: logError,
          user_id,
          operation_type: 'UPDATE'
        });
      }
    } catch (error) {
      logger.error('Error updating user', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      if (error instanceof UniqueConstraintError) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '用户名已存在',
          data: null
        };
        return;
      }

      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误',
        data: null
      };
    }
  }

  // 获取用户列表
  static async list(ctx) {
    try {
      const { page = 1, size = 10, username, email, phone, status, department_id } = ctx.query;
      const offset = (page - 1) * size;
      
      // 构建查询条件
      const where = {};
      if (username) where.username = { [Op.like]: `%${username}%` };
      if (email) where.email = { [Op.like]: `%${email}%` };
      if (phone) where.phone = { [Op.like]: `%${phone}%` };
      if (status) where.status = status;
      if (department_id) where.department_id = department_id;

      // 查询用户列表
      const { count, rows } = await User.scope('active').findAndCountAll({
        where,
        attributes: [
          'user_id',
          'username',
          'email',
          'phone',
          'status',
          'department_id',
          'created_at',
          'updated_at'
        ],
        order: [['created_at', 'DESC']],
        offset: parseInt(offset),
        limit: parseInt(size)
      });

      ctx.status = 200;
      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          total: count,
          items: rows,
          page: parseInt(page),
          size: parseInt(size)
        }
      };
    } catch (error) {
      logger.error('Error listing users', {
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

  // 用户登录
  static async login(ctx) {
    const { username, password } = ctx.request.body;

    try {
      logger.debug('User login attempt', { username });
      
      if (!username || !password) {
        const error = new CustomValidationError('用户名和密码不能为空');
        error.status = 400;
        throw error;
      }

      const user = await User.findOne({
        where: { username },
        attributes: ['user_id', 'username', 'password_hash', 'status']
      });

      logger.debug('User found', user ? { 
        user_id: user.user_id, 
        username: user.username,
        status: user.status
      } : null);

      // 检查登录限制（如果用户存在）
      if (user) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
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
          ctx.status = 401;
          ctx.body = {
            code: 401,
            message: '登录失败次数过多，请一小时后重试',
            data: {
              next_attempt_time: nextAttemptTime.toISOString()
            }
          };
          return;
        }

        // 记录登录尝试（只在用户存在时）
        const loginAttempt = {
          user_id: user.user_id,
          ip_address: ctx.ip,
          user_agent: ctx.headers['user-agent'],
          success: false
        };

        await LoginAttempt.create(loginAttempt);
      }

      if (!user) {
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

      if (user.status !== 'ACTIVE') {
        const error = new UnauthorizedError('用户已被禁用');
        error.status = 401;
        ctx.status = 401;
        ctx.body = {
          code: 401,
          message: error.message,
          data: null
        };
        return;
      }

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

      const token = jwt.sign(
        { user_id: user.user_id, username: user.username },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );
      
      const refreshToken = jwt.sign(
        { user_id: user.user_id },
        config.jwt.refreshSecret || config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn || '7d' }
      );

      // 保存刷新令牌到数据库
      await RefreshToken.create({
        user_id: user.user_id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后过期
        status: 'ACTIVE'
      });

      ctx.status = 200;
      ctx.body = {
        code: 200,
        message: 'success',
        data: {
          token: token,
          refresh_token: refreshToken,
          expires_in: config.jwt.expiresIn
        }
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

  // 刷新令牌
  static async refreshToken(ctx) {
    const { refresh_token } = ctx.request.body;

    try {
      logger.debug('Refreshing token', { refresh_token });

      if (!refresh_token) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '刷新令牌不能为空',
          data: null
        };
        return;
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
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // 生成新的刷新令牌
      const newRefreshToken = jwt.sign(
        { user_id: user.user_id },
        config.jwt.refreshSecret || config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn || '7d' }
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
          expires_in: config.jwt.expiresIn
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

  // 删除用户
  static async delete(ctx) {
    const { user_id } = ctx.params;

    try {
      logger.debug('Deleting user', { user_id });
      
      // 检查用户是否存在
      const user = await User.findOne({ 
        where: { user_id: user_id }
      });
      
      if (!user) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '用户不存在',
          data: null
        };
        return;
      }

      // 执行软删除
      await user.softDelete();
      logger.debug('User deleted successfully', { user_id });

      ctx.status = 200;
      ctx.body = {
        code: 200,
        message: 'success',
        data: null
      };

      // 记录操作日志
      try {
        await OperationLog.create({
          user_id: user_id,
          operation_type: 'DELETE',
          resource_type: 'user',
          resource_id: user_id,
          old_data: {
            username: user.username,
            email: user.email,
            phone: user.phone,
            status: user.status,
            deleted_at: null
          },
          new_data: {
            status: 'ARCHIVED',
            deleted_at: new Date()
          },
          status: 'SUCCESS'
        });
      } catch (logError) {
        logger.error('Failed to create operation log', {
          error: logError,
          user_id,
          operation_type: 'DELETE'
        });
      }
    } catch (error) {
      logger.error('Error deleting user', {
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

  // 恢复用户
  static async restore(ctx) {
    const { user_id } = ctx.params;

    try {
      logger.debug('Restoring user', { user_id });
      
      // 检查用户是否存在（包括已删除的）
      const user = await User.findOne({ 
        where: { user_id: user_id },
        paranoid: false  // 包括已删除的记录
      });
      
      if (!user) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '用户不存在',
          data: null
        };
        return;
      }

      // 如果用户未被删除，返回错误
      if (!user.deleted_at) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '用户未被删除',
          data: null
        };
        return;
      }

      // 恢复用户
      await User.restore(user);
      logger.debug('User restored successfully', { user_id });

      ctx.status = 200;
      ctx.body = {
        code: 200,
        message: 'success',
        data: null
      };

      // 记录操作日志
      try {
        await OperationLog.create({
          user_id: user_id,
          operation_type: 'RESTORE',
          resource_type: 'user',
          resource_id: user_id,
          old_data: {
            deleted_at: user.deleted_at,
            status: user.status
          },
          new_data: {
            deleted_at: null,
            status: 'ACTIVE'
          },
          status: 'SUCCESS'
        });
      } catch (logError) {
        logger.error('Failed to create operation log', {
          error: logError,
          user_id,
          operation_type: 'RESTORE'
        });
      }
    } catch (error) {
      logger.error('Error restoring user', {
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
}

module.exports = UserController;
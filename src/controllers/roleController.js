const { Role, Permission, RolePermission, sequelize } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

class RoleController {
  // 创建角色
  static async create(ctx) {
    const { role_name, code, description } = ctx.request.body;

    // 验证必填字段
    if (!role_name || !code) {
      ctx.status = 400;
      ctx.body = {
        code: 400,
        message: '角色名称和编码不能为空'
      };
      return;
    }

    try {
      // 检查角色编码是否已存在
      const existingRole = await Role.findOne({
        where: { code }
      });

      if (existingRole) {
        ctx.status = 400;
        ctx.body = {
          code: 400,
          message: '角色编码已存在'
        };
        return;
      }

      // 创建角色
      const role = await Role.create({
        role_id: uuidv4(),
        role_name,
        code,
        description,
        status: 'ACTIVE'
      });

      ctx.status = 200;
      ctx.body = {
        code: 200,
        message: '角色创建成功',
        data: role
      };
    } catch (error) {
      console.error('创建角色失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '创建角色失败'
      };
    }
  }

  // 获取角色列表
  static async list(ctx) {
    const { page = 1, pageSize = 10, status } = ctx.query;
    const offset = (page - 1) * pageSize;

    try {
      const where = {};
      if (status) {
        where.status = status;
      }

      const { count, rows } = await Role.findAndCountAll({
        where,
        offset,
        limit: parseInt(pageSize),
        order: [['created_at', 'DESC']],
        include: [{
          model: Permission,
          through: { attributes: [] }
        }]
      });

      ctx.status = 200;
      ctx.body = {
        code: 200,
        message: '获取角色列表成功',
        data: {
          total: count,
          items: rows,
          page: parseInt(page),
          size: parseInt(pageSize)
        }
      };
    } catch (error) {
      console.error('获取角色列表失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '获取角色列表失败'
      };
    }
  }

  // 获取角色详情
  static async getById(ctx) {
    const { role_id } = ctx.params;

    try {
      const role = await Role.findByPk(role_id, {
        include: [{
          model: Permission,
          through: { attributes: [] }
        }]
      });

      if (!role) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '角色不存在'
        };
        return;
      }

      ctx.status = 200;
      ctx.body = {
        code: 200,
        message: '获取角色详情成功',
        data: role
      };
    } catch (error) {
      console.error('获取角色详情失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '获取角色详情失败'
      };
    }
  }

  // 更新角色
  static async update(ctx) {
    const { role_id } = ctx.params;
    const { role_name, description } = ctx.request.body;

    try {
      const role = await Role.findByPk(role_id);
      if (!role) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '角色不存在'
        };
        return;
      }

      await role.update({
        role_name,
        description
      });

      ctx.status = 200;
      ctx.body = {
        code: 200,
        message: '角色更新成功',
        data: role
      };
    } catch (error) {
      console.error('更新角色失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '更新角色失败'
      };
    }
  }

  // 删除角色
  static async delete(ctx) {
    const { role_id } = ctx.params;

    try {
      const role = await Role.findByPk(role_id);
      if (!role) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: '角色不存在'
        };
        return;
      }

      // 软删除角色
      await role.update({
        status: 'ARCHIVED',
        deleted_at: new Date()
      });

      ctx.status = 200;
      ctx.body = {
        code: 200,
        message: '角色删除成功'
      };
    } catch (error) {
      console.error('删除角色失败:', error);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '删除角色失败'
      };
    }
  }
}

module.exports = RoleController; 
const db = require('../utils/db');

class PermissionController {
  // 分配角色
  static async assignRole(ctx) {
    const { user_id, role_ids } = ctx.request.body;

    // 检查用户是否存在
    const userQuery = 'SELECT * FROM uac.users WHERE user_id = $1';
    const userResult = await db.query(userQuery, [user_id]);
    if (userResult.rows.length === 0) {
      ctx.status = 404;
      ctx.body = {
        code: 404,
        message: '用户不存在',
        data: null
      };
      return;
    }

    // 检查角色是否存在
    const roleQuery = 'SELECT * FROM uac.roles WHERE role_id = ANY($1)';
    const roleResult = await db.query(roleQuery, [role_ids]);
    if (roleResult.rows.length !== role_ids.length) {
      ctx.status = 400;
      ctx.body = {
        code: 400,
        message: '部分角色不存在',
        data: null
      };
      return;
    }

    // 分配角色
    const assignQuery = `
      INSERT INTO uac.user_roles (user_id, role_id)
      SELECT $1, unnest($2::int[])
      ON CONFLICT (user_id, role_id) DO NOTHING
    `;
    await db.query(assignQuery, [user_id, role_ids]);

    ctx.body = {
      code: 200,
      message: 'success',
      data: null
    };
  }

  // 获取用户权限
  static async getUserPermissions(ctx) {
    const { user_id } = ctx.params;

    const query = `
      SELECT DISTINCT p.*
      FROM uac.users u
      JOIN uac.user_roles ur ON u.user_id = ur.user_id
      JOIN uac.role_permissions rp ON ur.role_id = rp.role_id
      JOIN uac.permissions p ON rp.permission_id = p.permission_id
      WHERE u.user_id = $1
    `;

    const result = await db.query(query, [user_id]);
    ctx.body = {
      code: 200,
      message: 'success',
      data: {
        roles: result.rows.map(r => r.role_id),
        permissions: result.rows
      }
    };
  }

  // 检查权限
  static async checkPermission(ctx) {
    const { user_id, resource_type, resource_id, action } = ctx.request.body;

    const query = `
      SELECT EXISTS (
        SELECT 1
        FROM uac.users u
        JOIN uac.user_roles ur ON u.user_id = ur.user_id
        JOIN uac.role_permissions rp ON ur.role_id = rp.role_id
        JOIN uac.permissions p ON rp.permission_id = p.permission_id
        WHERE u.user_id = $1
        AND p.resource_type = $2
        AND (p.resource_id = $3 OR p.resource_id IS NULL)
        AND p.action = $4
      ) as has_permission
    `;

    const result = await db.query(query, [user_id, resource_type, resource_id, action]);
    ctx.body = {
      code: 200,
      message: 'success',
      data: {
        hasPermission: result.rows[0].has_permission
      }
    };
  }

  // 创建数据权限规则
  static async createRule(ctx) {
    const { role_id, resource_type, action, conditions } = ctx.request.body;

    const query = `
      INSERT INTO uac.permissions (resource_type, action, conditions)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await db.query(query, [resource_type, action, conditions]);
    
    // 关联角色和权限
    const linkQuery = `
      INSERT INTO uac.role_permissions (role_id, permission_id)
      VALUES ($1, $2)
    `;
    await db.query(linkQuery, [role_id, result.rows[0].permission_id]);

    ctx.body = {
      code: 200,
      message: 'success',
      data: result.rows[0]
    };
  }

  // 获取数据权限规则
  static async getRules(ctx) {
    const { role_id, resource_type } = ctx.query;

    let query = `
      SELECT p.*
      FROM uac.permissions p
      JOIN uac.role_permissions rp ON p.permission_id = rp.permission_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (role_id) {
      query += ` AND rp.role_id = $${paramIndex}`;
      params.push(role_id);
      paramIndex++;
    }

    if (resource_type) {
      query += ` AND p.resource_type = $${paramIndex}`;
      params.push(resource_type);
    }

    const result = await db.query(query, params);
    ctx.body = {
      code: 200,
      message: 'success',
      data: result.rows
    };
  }
}

module.exports = PermissionController; 
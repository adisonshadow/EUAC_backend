const request = require('supertest');
const { User, Department, Role, Permission, UserRole, RolePermission, DataPermissionRule, RefreshToken, sequelize, LoginAttempt, OperationLog } = require('../src/models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// 生成随机测试数据
const generateRandomTestData = () => {
  const random = Math.floor(Math.random() * 10000);
  return {
    username: `perm_test_${random}`,
    email: `perm_test_${random}@example.com`,
    phone: `138${random.toString().padStart(8, '0')}`,
    password: 'password123',
    roleName: `测试角色_${random}`,
    roleCode: `TEST_ROLE_${random}`,
    permissionName: `测试权限_${random}`,
    permissionCode: `test:permission:${random}`
  };
};

describe('权限API测试', () => {
  let rootDepartment;
  let testUser;
  let testRole;
  let testPermission;
  let authToken;
  let refreshToken;
  let serverAvailable = false;
  let testData;

  beforeAll(async () => {
    try {
      await sequelize.authenticate();
      console.log('测试数据库连接成功');

      testData = generateRandomTestData();

      // 1. 查找所有测试部门
      const depts = await Department.findAll({ 
        where: { code: 'ROOT_DEPT_PERM_TEST' },
        paranoid: false
      });
      const deptIds = depts.map(d => d.department_id);

      // 2. 删除所有引用这些部门的用户（包括软删除）
      if (deptIds.length > 0) {
        const users = await User.findAll({
          where: { department_id: deptIds },
          attributes: ['user_id'],
          paranoid: false
        });
        const userIds = users.map(u => u.user_id);

        if (userIds.length > 0) {
          await RefreshToken.destroy({ where: { user_id: userIds }, force: true });
          await OperationLog.destroy({ where: { user_id: userIds }, force: true });
          await LoginAttempt.destroy({ where: { user_id: userIds }, force: true });
          await UserRole.destroy({ where: { user_id: userIds }, force: true });
          await User.destroy({ where: { user_id: userIds }, force: true });
        }
      }

      // 3. 清理角色和权限
      await RolePermission.destroy({ where: {}, force: true });
      await DataPermissionRule.destroy({ where: {}, force: true });
      await Role.destroy({ where: { code: testData.roleCode }, force: true });
      await Permission.destroy({ where: { code: testData.permissionCode }, force: true });

      // 4. 最后清理部门（包括软删除）
      await Department.destroy({ 
        where: { code: 'ROOT_DEPT_PERM_TEST' }, 
        force: true 
      });

      // 检查服务器是否可用
      try {
        const response = await request(global.testEnv.server)
          .get('/api/v1/health')
          .timeout(5000);
        
        if (response.status === 200 && response.body.code === 200) {
          serverAvailable = true;
          console.log('测试服务器可用');
        } else {
          console.warn('警告：测试服务器响应异常，跳过API测试');
          serverAvailable = false;
        }
      } catch (error) {
        console.warn('警告：测试服务器不可用，跳过API测试', error.message);
        serverAvailable = false;
      }

      // 创建根部门
      [rootDepartment] = await Department.findOrCreate({
        where: { code: 'ROOT_DEPT_PERM_TEST' },
        defaults: {
          name: '权限测试根部门',
          description: '用于权限测试的根部门',
          status: 'ACTIVE'
        }
      });

      // 创建测试角色
      [testRole] = await Role.findOrCreate({
        where: { code: testData.roleCode },
        defaults: {
          role_name: testData.roleName,
          description: '用于权限测试的角色',
          status: 'ACTIVE'
        }
      });

      // 创建测试权限
      [testPermission] = await Permission.findOrCreate({
        where: { code: testData.permissionCode },
        defaults: {
          name: testData.permissionName,
          description: '用于权限测试的权限',
          resource_type: 'test',
          action: 'manage',
          status: 'ACTIVE'
        }
      });

      // 创建测试用户
      [testUser] = await User.findOrCreate({
        where: { username: testData.username },
        defaults: {
          password_hash: await bcrypt.hash(testData.password, 10),
          email: testData.email,
          phone: testData.phone,
          status: 'ACTIVE',
          department_id: rootDepartment.department_id
        }
      });

      // 关联用户和角色
      await UserRole.findOrCreate({
        where: {
          user_id: testUser.user_id,
          role_id: testRole.role_id
        }
      });

      // 关联角色和权限
      await RolePermission.findOrCreate({
        where: {
          role_id: testRole.role_id,
          permission_id: testPermission.permission_id
        }
      });

      // 如果服务器可用，尝试登录获取token
      if (serverAvailable) {
        try {
          const loginResponse = await request(global.testEnv.server)
            .post('/api/v1/auth/login')
            .send({
              username: testData.username,
              password: testData.password
            });

          if (loginResponse.status === 200 && loginResponse.body.data.token) {
            authToken = loginResponse.body.data.token;
            refreshToken = loginResponse.body.data.refresh_token;
            console.log('成功获取认证token');
          } else {
            console.warn('登录失败，跳过需要认证的测试');
            serverAvailable = false;
          }
        } catch (error) {
          console.warn('登录请求失败，跳过需要认证的测试:', error.message);
          serverAvailable = false;
        }
      }
    } catch (error) {
      console.error('测试初始化失败:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // 按照依赖关系顺序清理数据
      if (testUser) {
        await RefreshToken.destroy({ where: { user_id: testUser.user_id } });
        await OperationLog.destroy({ where: { user_id: testUser.user_id } });
        await LoginAttempt.destroy({ where: { user_id: testUser.user_id } });
        await UserRole.destroy({ where: { user_id: testUser.user_id } });
        await testUser.destroy({ force: true });
      }
      if (testRole) {
        await RolePermission.destroy({ where: { role_id: testRole.role_id } });
        await DataPermissionRule.destroy({ where: { role_id: testRole.role_id } });
        await testRole.destroy({ force: true });
      }
      if (testPermission) {
        await RolePermission.destroy({ where: { permission_id: testPermission.permission_id } });
        await testPermission.destroy({ force: true });
      }
      if (rootDepartment) {
        await User.destroy({
          where: { department_id: rootDepartment.department_id },
          force: true,
          paranoid: false
        });
        await rootDepartment.destroy({ force: true });
      }
    } catch (error) {
      console.error('测试清理失败:', error);
    }
  });

  describe('权限管理 API', () => {
    describe('POST /api/v1/permissions', () => {
      it('应该成功创建新权限', async () => {
        const newPermission = {
          name: '新测试权限',
          code: `test:permission:new:${Date.now()}`,
          description: '新创建的测试权限',
          resource_type: 'test',
          action: 'create'
        };

        const response = await request(global.testEnv.server)
          .post('/api/v1/permissions')
          .set('Authorization', `Bearer ${authToken}`)
          .send(newPermission);

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data).toHaveProperty('permission_id');
        expect(response.body.data.name).toBe(newPermission.name);
        expect(response.body.data.code).toBe(newPermission.code);
        expect(response.body.data.resource_type).toBe(newPermission.resource_type);
        expect(response.body.data.action).toBe(newPermission.action);
      });

      it('应该验证权限代码唯一性', async () => {
        const duplicatePermission = {
          name: '重复权限',
          code: testData.permissionCode,
          description: '重复的权限代码',
          resource_type: 'test',
          action: 'read'
        };

        const response = await request(global.testEnv.server)
          .post('/api/v1/permissions')
          .set('Authorization', `Bearer ${authToken}`)
          .send(duplicatePermission);

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(400);
        expect(response.body.message).toContain('权限编码已存在');
      });
    });

    describe('GET /api/v1/permissions', () => {
      it('应该成功获取权限列表', async () => {
        const response = await request(global.testEnv.server)
          .get('/api/v1/permissions')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(Array.isArray(response.body.data.items)).toBe(true);
        expect(response.body.data.items.length).toBeGreaterThan(0);
      });

      it('应该支持分页和过滤', async () => {
        const response = await request(global.testEnv.server)
          .get('/api/v1/permissions')
          .query({
            page: 1,
            pageSize: 10,
            resource_type: 'test'
          })
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data).toHaveProperty('total');
        expect(response.body.data).toHaveProperty('items');
        expect(Array.isArray(response.body.data.items)).toBe(true);
      });
    });

    describe('PUT /api/v1/permissions/:permission_id', () => {
      it('应该成功更新权限信息', async () => {
        const updateData = {
          name: '更新后的权限名称',
          description: '更新后的权限描述'
        };

        const response = await request(global.testEnv.server)
          .put(`/api/v1/permissions/${testPermission.permission_id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data.name).toBe(updateData.name);
        expect(response.body.data.description).toBe(updateData.description);
      });
    });

    describe('DELETE /api/v1/permissions/:permission_id', () => {
      it('应该成功软删除权限', async () => {
        // 独立创建一条专用权限
        const tempPermission = await Permission.create({
          name: '软删除测试权限',
          code: `test:permission:softdelete:${Date.now()}`,
          description: '用于软删除测试',
          resource_type: 'test',
          action: 'delete',
          status: 'ACTIVE'
        });

        const response = await request(global.testEnv.server)
          .delete(`/api/v1/permissions/${tempPermission.permission_id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);

        // 验证权限被软删除
        const deletedPermission = await Permission.findByPk(tempPermission.permission_id, { paranoid: false });
        expect(deletedPermission).toBeTruthy();
        expect(deletedPermission.deleted_at).toBeTruthy();

        // 物理清理
        await deletedPermission.destroy({ force: true });
      });
    });
  });

  describe('角色权限关联 API', () => {
    describe('POST /api/v1/roles/:role_id/permissions', () => {
      it('应该成功为角色分配权限', async () => {
        const newPermission = await Permission.create({
          name: '新关联权限',
          code: `test:permission:link:${Date.now()}`,
          description: '用于测试关联的权限',
          resource_type: 'test',
          action: 'link',
          status: 'ACTIVE'
        });

        const response = await request(global.testEnv.server)
          .post(`/api/v1/roles/${testRole.role_id}/permissions`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            permission_ids: [newPermission.permission_id]
          });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.message).toContain('权限分配成功');

        // 验证关联是否成功
        const rolePermission = await RolePermission.findOne({
          where: {
            role_id: testRole.role_id,
            permission_id: newPermission.permission_id
          }
        });
        expect(rolePermission).toBeTruthy();

        // 清理测试数据
        await newPermission.destroy({ force: true });
      });
    });

    describe('DELETE /api/v1/roles/:role_id/permissions/:permission_id', () => {
      it('应该成功移除角色的权限', async () => {
        // 确保 RolePermission 关联存在
        await RolePermission.findOrCreate({
          where: {
            role_id: testRole.role_id,
            permission_id: testPermission.permission_id
          },
          defaults: {
            role_id: testRole.role_id,
            permission_id: testPermission.permission_id
          }
        });

        const response = await request(global.testEnv.server)
          .delete(`/api/v1/roles/${testRole.role_id}/permissions/${testPermission.permission_id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);

        // 验证关联是否已移除
        const rolePermission = await RolePermission.findOne({
          where: {
            role_id: testRole.role_id,
            permission_id: testPermission.permission_id
          }
        });
        expect(rolePermission).toBeNull();
      });
    });
  });

  describe('数据权限规则 API', () => {
    describe('POST /api/v1/data-permissions/rules', () => {
      it('应该成功创建数据权限规则', async () => {
        const ruleData = {
          role_id: testRole.role_id,
          resource_type: 'department',
          conditions: {
            department_id: rootDepartment.department_id
          }
        };

        const response = await request(global.testEnv.server)
          .post('/api/v1/data-permissions/rules')
          .set('Authorization', `Bearer ${authToken}`)
          .send(ruleData);

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data).toHaveProperty('rule_id');
        expect(response.body.data.resource_type).toBe(ruleData.resource_type);
        expect(response.body.data.conditions).toEqual(ruleData.conditions);
      });
    });

    describe('GET /api/v1/data-permissions/rules', () => {
      it('应该成功获取数据权限规则列表', async () => {
        const response = await request(global.testEnv.server)
          .get('/api/v1/data-permissions/rules')
          .query({
            role_id: testRole.role_id
          })
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(Array.isArray(response.body.data.items)).toBe(true);
      });
    });
  });
}); 
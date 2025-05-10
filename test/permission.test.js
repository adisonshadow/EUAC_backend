const request = require('supertest');
const app = require('../src/app');
const { User, Department, Role, Permission, UserRole, RolePermission, DataPermissionRule, RefreshToken, sequelize } = require('../src/models');
const bcrypt = require('bcryptjs');

describe('权限API测试', () => {
  let rootDepartment;
  let testUser;
  let testRole;
  let testPermission;
  let authToken;
  let refreshToken;

  beforeAll(async () => {
    try {
      // 确保数据库连接
      await sequelize.authenticate();
      console.log('测试数据库连接成功');

      // 创建根部门
      rootDepartment = await Department.create({
        name: '根部门',
        code: 'ROOT_DEPT_PERM',
        description: '根部门',
        status: 'ACTIVE'
      });

      // 创建测试权限
      testPermission = await Permission.create({
        name: '权限管理',
        code: 'permission:manage:test',
        description: '权限管理权限',
        resource_type: 'permission',
        action: 'manage',
        status: 'ACTIVE'
      });

      // 创建测试角色
      testRole = await Role.create({
        role_name: '权限管理员',
        description: '权限管理员角色'
      });

      // 创建测试用户
      testUser = await User.create({
        username: 'perm_admin',
        password_hash: await bcrypt.hash('password123', 10),
        email: 'perm@example.com',
        phone: '13800138002',
        status: 'ACTIVE',
        department_id: rootDepartment.department_id
      });

      // 关联用户和角色
      await UserRole.create({
        user_id: testUser.user_id,
        role_id: testRole.role_id
      });

      // 关联角色和权限
      await RolePermission.create({
        role_id: testRole.role_id,
        permission_id: testPermission.permission_id
      });

      // 登录获取token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'perm_admin',
          password: 'password123'
        });

      authToken = loginResponse.body.token;
      refreshToken = loginResponse.body.refresh_token;
    } catch (error) {
      console.error('测试初始化失败:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // 清理测试数据
    await testUser.destroy();
    await testRole.destroy();
    await testPermission.destroy();
    await rootDepartment.destroy();
  });

  describe('POST /api/v1/roles/assign', () => {
    it('应该成功为用户分配角色', async () => {
      const response = await request(app)
        .post('/api/v1/roles/assign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          user_id: testUser.user_id,
          role_ids: [testRole.role_id]
        });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/permissions/user/:user_id', () => {
    it('应该成功获取用户权限', async () => {
      const response = await request(app)
        .get(`/api/v1/permissions/user/${testUser.user_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('permission_id');
      expect(response.body[0]).toHaveProperty('code');
    });
  });

  describe('POST /api/v1/permissions/check', () => {
    it('应该成功检查用户权限', async () => {
      const response = await request(app)
        .post('/api/v1/permissions/check')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          permission_code: testPermission.code
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('hasPermission', true);
    });
  });

  describe('数据权限规则测试', () => {
    it('应该成功创建数据权限规则', async () => {
      const response = await request(app)
        .post('/api/v1/permissions/rules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role_id: testRole.role_id,
          resource_type: 'department',
          conditions: {
            department_id: rootDepartment.department_id
          }
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('rule_id');
      expect(response.body.resource_type).toBe('department');
    });

    it('应该成功获取数据权限规则', async () => {
      const response = await request(app)
        .get('/api/v1/permissions/rules')
        .query({
          role_id: testRole.role_id
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('rule_id');
      expect(response.body[0]).toHaveProperty('conditions');
    });
  });

  describe('刷新令牌测试', () => {
    it('应该成功刷新访问令牌', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refresh_token: refreshToken
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refresh_token');
    });

    it('不应该使用过期的刷新令牌', async () => {
      // 创建一个过期的刷新令牌
      const expiredToken = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refresh_token: refreshToken
        });

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refresh_token: expiredToken.body.refresh_token
        });

      expect(response.status).toBe(401);
    });
  });
}); 
const { execSync } = require('child_process');
const path = require('path');
const { sequelize } = require('../src/models');
const config = require('../config.json');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const { User, Role, Permission, UserRole, LoginAttempt } = require('../src/models');

// 设置测试环境变量
process.env.NODE_ENV = 'test';

// 设置JWT测试密钥
process.env.TEST_JWT_SECRET = 'test-jwt-secret';

// 全局测试环境变量
global.testEnv = {
  server: `http://localhost:${config.api.port}`,
  authToken: null,
  testUser: null,
  testRole: null,
  testPermission: null
};

// 全局设置函数
async function globalSetup() {
  try {
    console.log('\n=== 开始测试环境初始化 ===');
    
    // 1. 检查数据库连接
    await sequelize.authenticate();
    console.log('测试数据库连接成功');

    // 2. 检查服务器是否运行
    try {
      await request(global.testEnv.server).get('/api/v1/health');
      console.log('测试服务器连接成功');
    } catch (error) {
      console.error('警告：测试服务器未运行，请先运行 "node src/app.js"');
      console.error('测试将继续进行，但API测试可能会失败');
    }

    // 清理之前的测试数据
    await LoginAttempt.destroy({ where: {}, force: true });
    await UserRole.destroy({ where: {}, force: true });
    await User.destroy({ where: { username: 'dept_admin' }, force: true });
    await Role.destroy({ where: { role_name: '部门管理员' }, force: true });
    await Permission.destroy({ where: { code: 'department:manage:test' }, force: true });

    // 3. 创建或获取测试权限
    const [testPermission] = await Permission.findOrCreate({
      where: { code: 'department:manage:test' },
      defaults: {
        name: '部门管理',
        description: '部门管理权限',
        resource_type: 'department',
        action: 'manage',
        status: 'ACTIVE'
      }
    });
    global.testEnv.testPermission = testPermission;

    // 4. 创建或获取测试角色
    const [testRole] = await Role.findOrCreate({
      where: { role_name: '部门管理员' },
      defaults: {
        code: 'DEPT_ADMIN_ROLE',
        description: '部门管理员角色',
        status: 'ACTIVE'
      }
    });
    global.testEnv.testRole = testRole;

    console.log('测试角色数据:', {
      id: testRole.role_id,
      name: testRole.role_name,
      status: testRole.status
    });

    // 5. 创建测试用户
    const password = 'password123';
    const [testUser] = await User.findOrCreate({
      where: { username: 'dept_admin' },
      defaults: {
        password_hash: await bcrypt.hash(password, 10),
        email: 'dept@example.com',
        phone: '13800138001',
        department_id: 1,
        status: 'ACTIVE'
      }
    });

    // 如果用户已存在，确保密码正确
    if (!testUser.isNewRecord) {
      testUser.password_hash = await bcrypt.hash(password, 10);
      await testUser.save();
    }
    global.testEnv.testUser = testUser;

    // 清理该用户的登录尝试记录
    await LoginAttempt.destroy({
      where: {
        user_id: testUser.user_id
      }
    });

    // 验证用户数据
    console.log('测试用户数据:', {
      id: testUser.user_id,
      username: testUser.username,
      status: testUser.status,
      hasPassword: !!testUser.password_hash
    });

    // 6. 关联用户和角色
    const [userRole] = await UserRole.findOrCreate({
      where: {
        user_id: testUser.user_id,
        role_id: testRole.role_id
      }
    });

    console.log('用户角色关联:', {
      userId: userRole.user_id,
      roleId: userRole.role_id
    });

    // 7. 获取认证token（如果服务器可用）
    try {
      console.log('尝试登录...');
      const loginResponse = await request(global.testEnv.server)
        .post('/api/v1/auth/login')
        .send({
          username: testUser.username,
          password: password
        });

      if (loginResponse.body.data?.token) {
        global.testEnv.authToken = loginResponse.body.data.token;
        console.log('成功获取认证token');
      } else {
        console.warn('警告：无法获取认证token，API测试可能会失败');
      }
    } catch (error) {
      console.warn('警告：登录失败，API测试可能会失败');
    }

    console.log('测试环境初始化完成');

  } catch (error) {
    console.error('测试环境初始化失败:', error);
    throw error;
  }
}

// 全局清理函数
async function globalTeardown() {
  try {
    // 1. 清理测试数据
    if (global.testEnv.testUser) {
      await UserRole.destroy({ where: { user_id: global.testEnv.testUser.user_id } });
      await global.testEnv.testUser.destroy();
    }

    if (global.testEnv.testRole) {
      await global.testEnv.testRole.destroy();
    }

    if (global.testEnv.testPermission) {
      await global.testEnv.testPermission.destroy();
    }

    // 2. 关闭数据库连接
    await sequelize.close();

    console.log('测试环境清理完成');
  } catch (error) {
    console.error('测试环境清理失败:', error);
    throw error;
  }
}

// 导出全局设置和清理函数
module.exports = globalSetup;
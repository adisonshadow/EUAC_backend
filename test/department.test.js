const request = require('supertest');
const { Department, DepartmentClosure, DepartmentHistory, sequelize } = require('../src/models');
const { Op } = require('sequelize');

describe('部门管理 API 测试', () => {
  let rootDepartment;
  let testDepartment;

  beforeAll(async () => {
    try {
      // 使用全局测试环境
      const { server, authToken } = global.testEnv;
      if (!server || !authToken) {
        throw new Error('测试环境未正确初始化');
      }

      // 先清空 login_attempts 表，避免外键约束错误
      const { User, OperationLog, LoginAttempt } = require('../src/models');
      await LoginAttempt.destroy({ where: {}, force: true });
      // 再清空 operation_logs 表
      await OperationLog.destroy({ where: {}, force: true });
      // 再清空用户表
      await User.destroy({ where: {}, force: true });

      // 先清理 department_closure 表中的记录
      await DepartmentClosure.destroy({
        where: {},
        force: true
      });

      // 再清理 department_history 表中的记录
      await DepartmentHistory.destroy({
        where: {},
        force: true
      });

      // 再清理子部门
      await Department.destroy({ 
        where: { 
          parent_id: { [Op.ne]: null } 
        },
        force: true 
      });

      // 最后清理根部门
      await Department.destroy({ 
        where: { 
          code: 'ROOT_DEPT_TEST' 
        },
        force: true 
      });

      // 创建根部门
      rootDepartment = await Department.create({
        name: '根部门',
        code: 'ROOT_DEPT_TEST',
        description: '根部门',
        status: 'ACTIVE'
      });

    } catch (error) {
      console.error('测试初始化失败:', error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // 清理测试数据
      if (testDepartment) {
        try {
          await DepartmentClosure.destroy({ 
            where: { 
              [Op.or]: [
                { ancestor_id: testDepartment.department_id },
                { descendant_id: testDepartment.department_id }
              ]
            },
            force: true
          });
        } catch (error) {
          console.error('清理部门闭包表失败:', error);
        }

        try {
          await DepartmentHistory.destroy({ 
            where: { 
              department_id: testDepartment.department_id 
            },
            force: true
          });
        } catch (error) {
          console.error('清理部门历史表失败:', error);
        }

        try {
          await testDepartment.destroy({ force: true });
        } catch (error) {
          console.error('清理测试部门失败:', error);
        }
      }

      if (rootDepartment) {
        try {
          // 先删除所有子部门
          await Department.destroy({
            where: {
              parent_id: rootDepartment.department_id
            },
            force: true
          });
        } catch (error) {
          console.error('清理子部门失败:', error);
        }

        try {
          await DepartmentClosure.destroy({ 
            where: { 
              [Op.or]: [
                { ancestor_id: rootDepartment.department_id },
                { descendant_id: rootDepartment.department_id }
              ]
            },
            force: true
          });
        } catch (error) {
          console.error('清理根部门闭包表失败:', error);
        }

        try {
          await DepartmentHistory.destroy({ 
            where: { 
              department_id: rootDepartment.department_id 
            },
            force: true
          });
        } catch (error) {
          console.error('清理根部门历史表失败:', error);
        }

        try {
          await rootDepartment.destroy({ force: true });
        } catch (error) {
          console.error('清理根部门失败:', error);
        }
      }
    } catch (error) {
      console.error('清理测试数据失败:', error);
    }
  });

  describe('部门创建 POST /api/v1/departments', () => {
    it('应该成功创建新部门', async () => {
      const { server, authToken } = global.testEnv;
      const response = await request(server)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '测试部门',
          code: 'TEST_DEPT_1',
          parent_id: rootDepartment.department_id,
          status: 'ACTIVE',
          description: '测试部门描述'
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('department_id');
      expect(response.body.data.name).toBe('测试部门');
      expect(response.body.data.code).toBe('TEST_DEPT_1');

      // 保存创建的部门实例供后续测试使用
      testDepartment = await Department.findByPk(response.body.data.department_id);
    });

    it('不应该创建重复编码的部门', async () => {
      const { server, authToken } = global.testEnv;
      const response = await request(server)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '测试部门2',
          code: 'TEST_DEPT_1',
          parent_id: rootDepartment.department_id,
          status: 'ACTIVE',
          description: '测试部门描述2'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('部门查询 GET /api/v1/departments', () => {
    it('应该返回部门列表', async () => {
      const { server, authToken } = global.testEnv;
      const response = await request(server)
        .get('/api/v1/departments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThan(0);
    });

    it('应该支持分页查询', async () => {
      const { server, authToken } = global.testEnv;
      const response = await request(server)
        .get('/api/v1/departments')
        .query({
          page: 1,
          size: 10
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });
  });

  describe('部门详情 GET /api/v1/departments/:department_id', () => {
    it('应该返回指定部门的详细信息', async () => {
      const { server, authToken } = global.testEnv;
      const response = await request(server)
        .get(`/api/v1/departments/${testDepartment.department_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.department_id).toBe(testDepartment.department_id);
      expect(response.body.data.name).toBe('测试部门');
      expect(response.body.data.code).toBe('TEST_DEPT_1');
    });

    it('当部门不存在时应该返回404', async () => {
      const { server, authToken } = global.testEnv;
      const response = await request(server)
        .get('/api/v1/departments/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('部门更新 PUT /api/v1/departments/:department_id', () => {
    it('应该成功更新部门信息并记录历史', async () => {
      const { server, authToken } = global.testEnv;
      const response = await request(server)
        .put(`/api/v1/departments/${testDepartment.department_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '更新后的部门',
          description: '更新后的描述'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('更新后的部门');
      expect(response.body.data.description).toBe('更新后的描述');
    });

    it('不应该更新为已存在的部门编码', async () => {
      // 先创建另一个部门
      const otherDept = await Department.create({
        name: '其他部门',
        code: 'OTHER_DEPT',
        parent_id: rootDepartment.department_id,
        status: 'ACTIVE',
        description: '其他部门描述'
      });

      const { server, authToken } = global.testEnv;
      const response = await request(server)
        .put(`/api/v1/departments/${testDepartment.department_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: 'OTHER_DEPT'
        });

      expect(response.status).toBe(400);

      // 清理
      await otherDept.destroy({ force: true });
    });
  });

  describe('部门删除 DELETE /api/v1/departments/:department_id', () => {
    it('应该成功删除部门', async () => {
      const { server, authToken } = global.testEnv;
      const response = await request(server)
        .delete(`/api/v1/departments/${testDepartment.department_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('不应该删除有子部门的部门', async () => {
      // 创建子部门
      const childDept = await Department.create({
        name: '子部门',
        code: 'CHILD_DEPT',
        parent_id: rootDepartment.department_id,
        status: 'ACTIVE',
        description: '子部门描述'
      });

      const { server, authToken } = global.testEnv;
      const response = await request(server)
        .delete(`/api/v1/departments/${rootDepartment.department_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);

      // 清理
      await childDept.destroy({ force: true });
    });
  });

  describe('部门树结构 GET /api/v1/departments/tree', () => {
    it('应该返回部门树结构', async () => {
      const { server, authToken } = global.testEnv;
      const response = await request(server)
        .get('/api/v1/departments/tree')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThan(0);
    });
  });
}); 
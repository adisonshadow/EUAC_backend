const initDatabase = require('../src/config/init-db');
const { sequelize } = require('../src/models');

describe('数据库初始化测试', () => {
  beforeAll(async () => {
    // 确保数据库连接
    await sequelize.authenticate();
    console.log('测试数据库连接成功');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('应该成功初始化数据库', async () => {
    console.log('\n开始测试数据库初始化...');
    
    try {
      // 执行数据库初始化
      await initDatabase();
      
      // 验证表是否创建成功
      const result = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'uac'
        ORDER BY table_name
      `);
      
      // 检查是否创建了所有必要的表
      const expectedTables = [
        'departments',
        'department_closure',
        'department_history',
        'users',
        'roles',
        'permissions',
        'role_permissions',
        'user_roles',
        'data_permission_rules',
        'operation_logs',
        'refresh_tokens'
      ];
      
      const createdTables = result[0].map(t => t.table_name);
      console.log('创建的表:', createdTables);
      
      // 验证所有必要的表都已创建
      expectedTables.forEach(table => {
        expect(createdTables).toContain(table);
      });
      
      // 验证表结构
      const departmentsResult = await sequelize.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'uac' 
        AND table_name = 'departments'
        ORDER BY ordinal_position
      `);
      
      console.log('departments表结构:', departmentsResult[0]);
      
      // 验证departments表的关键字段
      const expectedColumns = [
        { name: 'department_id', type: 'integer' },
        { name: 'name', type: 'character varying' },
        { name: 'code', type: 'character varying' },
        { name: 'status', type: 'character varying' }
      ];
      
      expectedColumns.forEach(column => {
        const found = departmentsResult[0].find(c => 
          c.column_name === column.name && 
          c.data_type === column.type
        );
        expect(found).toBeTruthy();
      });
      
    } catch (error) {
      console.error('数据库初始化测试失败:', error);
      throw error;
    }
  });
}); 
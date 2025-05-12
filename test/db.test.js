const { sequelize } = require('../src/models');
const fs = require('fs');
const path = require('path');

describe('数据库健康检查', () => {
  beforeAll(async () => {
    // 确保数据库连接
    await sequelize.authenticate();
    console.log('测试数据库连接成功');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('数据库连接状态检查', async () => {
    try {
      const result = await sequelize.query('SELECT 1');
      expect(result[0][0]['?column?']).toBe(1);
    } catch (error) {
      console.error('数据库连接测试失败:', error);
      throw error;
    }
  });

  test('数据库表结构检查', async () => {
    console.log('\n开始检查数据库表结构...');
    
    try {
      // 获取当前数据库中的所有表
      const result = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'uac'
        ORDER BY table_name
      `);
      
      // 检查是否包含所有必要的表
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
      
      const existingTables = result[0].map(t => t.table_name);
      console.log('现有表:', existingTables);
      
      // 验证所有必要的表都存在
      expectedTables.forEach(table => {
        expect(existingTables).toContain(table);
      });
      
    } catch (error) {
      console.error('表结构检查失败:', error);
      throw error;
    }
  });

  test('数据库表字段检查', async () => {
    try {
      // 读取UAC_Schema.sql文件
      const schemaPath = path.join(__dirname, '../Documents/UAC_Schema.sql');
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      // 检查关键表的字段
      const tablesToCheck = ['users', 'roles', 'permissions', 'departments'];
      
      for (const table of tablesToCheck) {
        const columns = await sequelize.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_schema = 'uac' 
          AND table_name = '${table}'
          ORDER BY ordinal_position
        `);
        
        console.log(`${table}表结构:`, columns[0]);
        
        // 验证关键字段
        const expectedColumns = {
          users: [
            { name: 'user_id', type: 'uuid' },
            { name: 'username', type: 'character varying' },
            { name: 'email', type: 'character varying' },
            { name: 'status', type: 'character varying' }
          ],
          roles: [
            { name: 'role_id', type: 'uuid' },
            { name: 'role_name', type: 'character varying' },
            { name: 'code', type: 'character varying' },
            { name: 'status', type: 'character varying' }
          ],
          permissions: [
            { name: 'permission_id', type: 'uuid' },
            { name: 'name', type: 'character varying' },
            { name: 'code', type: 'character varying' },
            { name: 'status', type: 'character varying' }
          ],
          departments: [
            { name: 'department_id', type: 'uuid' },
            { name: 'name', type: 'character varying' },
            { name: 'code', type: 'character varying' },
            { name: 'status', type: 'character varying' }
          ]
        };
        
        expectedColumns[table].forEach(column => {
          const found = columns[0].find(c => 
            c.column_name === column.name && 
            c.data_type === column.type
          );
          expect(found).toBeTruthy();
        });
      }
    } catch (error) {
      console.error('字段检查失败:', error);
      throw error;
    }
  });

  test('数据库索引检查', async () => {
    try {
      const tablesToCheck = ['users', 'roles', 'permissions', 'departments'];
      
      for (const table of tablesToCheck) {
        const indexes = await sequelize.query(`
          SELECT indexname, indexdef
          FROM pg_indexes
          WHERE schemaname = 'uac'
          AND tablename = '${table}'
        `);
        
        console.log(`${table}表索引:`, indexes[0]);
        
        // 验证必要的索引
        const expectedIndexes = {
          users: ['users_pkey', 'idx_users_username', 'idx_users_email', 'idx_users_department_id', 'idx_users_deleted_at', 'idx_users_status'],
          roles: ['roles_pkey', 'roles_code_key', 'idx_roles_deleted_at', 'idx_roles_status'],
          permissions: ['permissions_pkey', 'permissions_code_key', 'idx_permissions_deleted_at', 'idx_permissions_status'],
          departments: ['departments_pkey', 'departments_code_key', 'idx_departments_deleted_at', 'idx_departments_status']
        };
        
        const existingIndexes = indexes[0].map(i => i.indexname);
        expectedIndexes[table].forEach(index => {
          expect(existingIndexes).toContain(index);
        });
      }
    } catch (error) {
      console.error('索引检查失败:', error);
      throw error;
    }
  });

  test('数据库外键检查', async () => {
    try {
      const tablesToCheck = ['role_permissions', 'user_roles', 'data_permission_rules'];
      
      for (const table of tablesToCheck) {
        const foreignKeys = await sequelize.query(`
          SELECT
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'uac'
          AND tc.table_name = '${table}'
        `);
        
        console.log(`${table}表外键:`, foreignKeys[0]);
        
        // 验证必要的外键
        const expectedForeignKeys = {
          role_permissions: [
            { column: 'role_id', references: 'roles' },
            { column: 'permission_id', references: 'permissions' }
          ],
          user_roles: [
            { column: 'user_id', references: 'users' },
            { column: 'role_id', references: 'roles' }
          ],
          data_permission_rules: [
            { column: 'role_id', references: 'roles' }
          ]
        };
        
        expectedForeignKeys[table].forEach(fk => {
          const found = foreignKeys[0].find(f => 
            f.column_name === fk.column && 
            f.foreign_table_name === fk.references
          );
          expect(found).toBeTruthy();
        });
      }
    } catch (error) {
      console.error('外键检查失败:', error);
      throw error;
    }
  });

  test('数据库性能检查', async () => {
    try {
      // 检查数据库版本
      const versionResult = await sequelize.query('SELECT version()');
      console.log('数据库版本:', versionResult[0][0].version);

      // 检查数据库大小
      const dbSizeResult = await sequelize.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as db_size
      `);
      console.log('数据库大小:', dbSizeResult[0][0].db_size);

      // 检查表大小
      const tableSizeResult = await sequelize.query(`
        SELECT 
          table_name,
          pg_size_pretty(pg_total_relation_size('uac.' || table_name)) as total_size,
          pg_size_pretty(pg_relation_size('uac.' || table_name)) as table_size,
          pg_size_pretty(pg_total_relation_size('uac.' || table_name) - pg_relation_size('uac.' || table_name)) as index_size
        FROM (
          SELECT table_name::text
          FROM information_schema.tables
          WHERE table_schema = 'uac'
        ) as tables
        ORDER BY pg_total_relation_size('uac.' || table_name) DESC
      `);
      console.log('表大小统计:', tableSizeResult[0]);

      // 检查死锁情况
      const deadlockResult = await sequelize.query(`
        SELECT blocked_locks.pid AS blocked_pid,
               blocked_activity.usename AS blocked_user,
               blocking_locks.pid AS blocking_pid,
               blocking_activity.usename AS blocking_user,
               blocked_activity.query AS blocked_statement
        FROM pg_catalog.pg_locks blocked_locks
        JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
        JOIN pg_catalog.pg_locks blocking_locks 
            ON blocking_locks.locktype = blocked_locks.locktype
            AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE
            AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
            AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
            AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
            AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
            AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
            AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
            AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
            AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
            AND blocking_locks.pid != blocked_locks.pid
        JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
        WHERE NOT blocked_locks.GRANTED
      `);
      console.log('死锁情况:', deadlockResult[0]);

      // 验证没有死锁
      expect(deadlockResult[0].length).toBe(0);
    } catch (error) {
      console.error('性能检查失败:', error);
      throw error;
    }
  });

  test('连接池状态检查', async () => {
    try {
      // 检查连接池状态
      const poolStatus = await sequelize.query(`
        SELECT 
          count(*)::integer as total_connections,
          sum(case when state = 'active' then 1 else 0 end)::integer as active_connections,
          sum(case when state = 'idle' then 1 else 0 end)::integer as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `);
      
      console.log('连接池状态:', poolStatus[0][0]);
      
      // 验证连接池状态
      expect(poolStatus[0][0].total_connections).toBeGreaterThan(0);
      expect(poolStatus[0][0].active_connections).toBeGreaterThanOrEqual(0);
      expect(poolStatus[0][0].idle_connections).toBeGreaterThanOrEqual(0);
    } catch (error) {
      console.error('连接池检查失败:', error);
      throw error;
    }
  });

  test('软删除功能检查', async () => {
    try {
      // 检查支持软删除的表
      const softDeleteTables = ['users', 'roles', 'permissions', 'departments', 'data_permission_rules'];
      
      for (const table of softDeleteTables) {
        // 检查deleted_at字段
        const columnCheck = await sequelize.query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'uac'
          AND table_name = '${table}'
          AND column_name = 'deleted_at'
        `);
        
        console.log(`${table}表软删除字段:`, columnCheck[0]);
        
        // 验证deleted_at字段存在
        expect(columnCheck[0].length).toBe(1);
        expect(columnCheck[0][0].data_type).toBe('timestamp with time zone');

        // 检查软删除索引
        const indexCheck = await sequelize.query(`
          SELECT indexname
          FROM pg_indexes
          WHERE schemaname = 'uac'
          AND tablename = '${table}'
          AND indexname LIKE '%deleted_at%'
        `);
        
        console.log(`${table}表软删除索引:`, indexCheck[0]);
        
        // 验证软删除索引存在
        expect(indexCheck[0].length).toBeGreaterThan(0);
      }
    } catch (error) {
      console.error('软删除功能检查失败:', error);
      throw error;
    }
  });

  test('数据库约束检查', async () => {
    try {
      const tablesToCheck = ['users', 'roles', 'permissions', 'departments'];
      
      for (const table of tablesToCheck) {
        // 检查表约束
        const constraints = await sequelize.query(`
          SELECT 
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints tc
          LEFT JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
          LEFT JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.table_schema = 'uac'
          AND tc.table_name = '${table}'
        `);
        
        console.log(`${table}表约束:`, constraints[0]);
        
        // 验证主键约束
        const hasPrimaryKey = constraints[0].some(c => c.constraint_type === 'PRIMARY KEY');
        expect(hasPrimaryKey).toBe(true);
        
        // 验证唯一约束
        const hasUniqueConstraint = constraints[0].some(c => c.constraint_type === 'UNIQUE');
        expect(hasUniqueConstraint).toBe(true);
      }
    } catch (error) {
      console.error('约束检查失败:', error);
      throw error;
    }
  });

  test('数据库性能统计检查', async () => {
    try {
      // 检查表扫描统计
      const tableScanStats = await sequelize.query(`
        SELECT 
          schemaname,
          relname as table_name,
          seq_scan as sequential_scans,
          seq_tup_read as sequential_tuples_read,
          idx_scan as index_scans,
          idx_tup_fetch as index_tuples_fetched,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables
        WHERE schemaname = 'uac'
        ORDER BY seq_scan DESC
      `);
      console.log('表扫描统计:', tableScanStats[0]);

      // 检查索引使用情况
      const indexStats = await sequelize.query(`
        SELECT 
          schemaname,
          relname as table_name,
          indexrelname as index_name,
          idx_scan as index_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes
        WHERE schemaname = 'uac'
        ORDER BY idx_scan DESC
      `);
      console.log('索引使用统计:', indexStats[0]);

      // 检查缓存命中率
      const cacheHitRatio = await sequelize.query(`
        SELECT 
          sum(heap_blks_read)::integer as heap_read,
          sum(heap_blks_hit)::integer as heap_hit,
          (sum(heap_blks_hit)::float / (sum(heap_blks_hit) + sum(heap_blks_read)))::float as ratio
        FROM pg_statio_user_tables
        WHERE schemaname = 'uac'
      `);
      console.log('缓存命中率:', cacheHitRatio[0][0]);

      // 验证缓存命中率是否在合理范围内
      expect(cacheHitRatio[0][0].ratio).toBeGreaterThan(0.8);
    } catch (error) {
      console.error('性能统计检查失败:', error);
      throw error;
    }
  });

  test('表空间使用情况检查', async () => {
    try {
      // 检查表空间使用情况
      const tablespaceUsage = await sequelize.query(`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as database_size,
          pg_size_pretty(pg_total_relation_size('uac.users')) as users_size,
          pg_size_pretty(pg_total_relation_size('uac.roles')) as roles_size,
          pg_size_pretty(pg_total_relation_size('uac.permissions')) as permissions_size,
          pg_size_pretty(pg_total_relation_size('uac.departments')) as departments_size
      `);
      console.log('表空间使用情况:', tablespaceUsage[0][0]);

      // 检查表膨胀情况
      const tableBloat = await sequelize.query(`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as total_size,
          pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) as table_size,
          pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename) - pg_relation_size(schemaname || '.' || tablename)) as bloat_size
        FROM pg_tables
        WHERE schemaname = 'uac'
        ORDER BY (pg_total_relation_size(schemaname || '.' || tablename) - pg_relation_size(schemaname || '.' || tablename)) DESC
      `);
      console.log('表膨胀情况:', tableBloat[0]);

      // 验证表空间使用是否合理
      tablespaceUsage[0].forEach(table => {
        expect(table.database_size).toBeDefined();
        expect(table.users_size).toBeDefined();
        expect(table.roles_size).toBeDefined();
        expect(table.permissions_size).toBeDefined();
        expect(table.departments_size).toBeDefined();
      });
    } catch (error) {
      console.error('表空间检查失败:', error);
      throw error;
    }
  });

  test('数据库配置检查', async () => {
    try {
      // 检查关键配置参数
      const configParams = await sequelize.query(`
        SELECT name, setting, unit, context, short_desc
        FROM pg_settings
        WHERE name IN (
          'max_connections',
          'shared_buffers',
          'effective_cache_size',
          'maintenance_work_mem',
          'checkpoint_completion_target',
          'wal_buffers',
          'default_statistics_target',
          'random_page_cost',
          'effective_io_concurrency',
          'work_mem',
          'min_wal_size',
          'max_wal_size'
        )
        ORDER BY name
      `);
      console.log('数据库配置参数:', configParams[0]);

      // 验证关键配置是否在合理范围内
      const configs = configParams[0].reduce((acc, curr) => {
        acc[curr.name] = curr.setting;
        return acc;
      }, {});

      // 验证最大连接数
      expect(parseInt(configs.max_connections)).toBeGreaterThanOrEqual(100);
      // 验证共享缓冲区
      expect(parseInt(configs.shared_buffers)).toBeGreaterThan(0);
      // 验证工作内存
      expect(parseInt(configs.work_mem)).toBeGreaterThan(0);

      // 检查数据库角色和权限
      const roles = await sequelize.query(`
        SELECT 
          rolname,
          rolsuper,
          rolcreaterole,
          rolcreatedb,
          rolcanlogin
        FROM pg_roles
        WHERE rolname NOT LIKE 'pg_%'
      `);
      console.log('数据库角色:', roles[0]);

      // 仅在存在uac_app角色时才断言，否则输出警告
      const appRole = roles[0].find(r => r.rolname === 'uac_app');
      if (appRole) {
        expect(appRole.rolsuper).toBe(false);
        expect(appRole.rolcanlogin).toBe(true);
      } else {
        console.warn('警告：未找到uac_app角色，跳过相关断言。');
      }
    } catch (error) {
      console.error('配置检查失败:', error);
      throw error;
    }
  });

  test('数据库维护检查', async () => {
    try {
      // 检查是否需要VACUUM
      const vacuumNeeded = await sequelize.query(`
        SELECT 
          schemaname,
          relname as table_name,
          n_dead_tup as dead_tuples,
          n_live_tup as live_tuples,
          CASE 
            WHEN n_live_tup > 0 THEN (n_dead_tup * 100.0 / n_live_tup)
            ELSE 0
          END as dead_tuple_ratio
        FROM pg_stat_user_tables
        WHERE schemaname = 'uac'
        AND n_dead_tup > 0
        ORDER BY dead_tuple_ratio DESC
      `);
      console.log('需要VACUUM的表:', vacuumNeeded[0]);

      // 检查是否需要ANALYZE
      const analyzeNeeded = await sequelize.query(`
        SELECT 
          schemaname,
          relname as table_name,
          last_autoanalyze,
          last_analyze,
          CASE 
            WHEN last_analyze IS NULL THEN 'Never'
            ELSE age(now(), last_analyze)::text
          END as age_since_last_analyze
        FROM pg_stat_user_tables
        WHERE schemaname = 'uac'
        ORDER BY last_analyze NULLS FIRST
      `);
      console.log('需要ANALYZE的表:', analyzeNeeded[0]);

      // 检查是否需要REINDEX
      const reindexNeeded = await sequelize.query(`
        SELECT 
          schemaname,
          relname as table_name,
          indexrelname as index_name,
          pg_size_pretty(pg_relation_size(schemaname || '.' || indexrelname::text)) as index_size,
          idx_scan as number_of_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes
        WHERE schemaname = 'uac'
        AND idx_scan = 0
        ORDER BY pg_relation_size(schemaname || '.' || indexrelname::text) DESC
      `);
      console.log('需要REINDEX的索引:', reindexNeeded[0]);

      // 设置警告阈值
      const warningThreshold = 15;
      const criticalThreshold = 30;

      // 检查VACUUM需求
      if (vacuumNeeded[0].length > warningThreshold) {
        console.warn(`警告：需要VACUUM的表数量为${vacuumNeeded[0].length}，超出警告阈值${warningThreshold}`);
        if (vacuumNeeded[0].length > criticalThreshold) {
          console.error(`严重警告：需要VACUUM的表数量为${vacuumNeeded[0].length}，超出严重阈值${criticalThreshold}`);
        }
      }

      // 检查ANALYZE需求
      if (analyzeNeeded[0].length > warningThreshold) {
        console.warn(`警告：需要ANALYZE的表数量为${analyzeNeeded[0].length}，超出警告阈值${warningThreshold}`);
        if (analyzeNeeded[0].length > criticalThreshold) {
          console.error(`严重警告：需要ANALYZE的表数量为${analyzeNeeded[0].length}，超出严重阈值${criticalThreshold}`);
        }
      }

      // 检查REINDEX需求
      if (reindexNeeded[0].length > warningThreshold) {
        console.warn(`警告：需要REINDEX的索引数量为${reindexNeeded[0].length}，超出警告阈值${warningThreshold}`);
        if (reindexNeeded[0].length > criticalThreshold) {
          console.error(`严重警告：需要REINDEX的索引数量为${reindexNeeded[0].length}，超出严重阈值${criticalThreshold}`);
        }
      }

      // 输出维护建议
      if (vacuumNeeded[0].length > 0 || analyzeNeeded[0].length > 0 || reindexNeeded[0].length > 0) {
        console.log('\n数据库维护建议:');
        if (vacuumNeeded[0].length > 0) {
          console.log('- 建议执行 VACUUM 操作，清理死元组');
        }
        if (analyzeNeeded[0].length > 0) {
          console.log('- 建议执行 ANALYZE 操作，更新统计信息');
        }
        if (reindexNeeded[0].length > 0) {
          console.log('- 建议执行 REINDEX 操作，重建未使用的索引');
        }
      }
    } catch (error) {
      console.error('维护检查失败:', error);
      throw error;
    }
  });
}); 
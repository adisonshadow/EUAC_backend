const { sequelize } = require('../src/models');
const { User, Role, Permission, UserRole } = require('../src/models');

async function globalTeardown() {
  try {
    // 1. 清理测试数据
    if (global.testEnv?.testUser) {
      await UserRole.destroy({ where: { user_id: global.testEnv.testUser.user_id } });
      await global.testEnv.testUser.destroy();
    }

    if (global.testEnv?.testRole) {
      await global.testEnv.testRole.destroy();
    }

    if (global.testEnv?.testPermission) {
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

module.exports = globalTeardown; 
const { Permission, sequelize } = require('../src/models');

(async () => {
  try {
    await sequelize.authenticate();
    // 1. 创建
    const perm = await Permission.create({
      name: '软删除测试',
      code: `test:softdelete:${Date.now()}`,
      resource_type: 'test',
      action: 'test',
      status: 'ACTIVE'
    });
    console.log('创建:', perm.permission_id);

    // 2. 软删除
    await perm.destroy();
    console.log('软删除完成');

    // 3. 默认查找（应查不到）
    const found1 = await Permission.findByPk(perm.permission_id);
    console.log('默认查找:', found1); // 应为 null

    // 4. paranoid: false 查找（应查到且 deleted_at 有值）
    const found2 = await Permission.findByPk(perm.permission_id, { paranoid: false });
    console.log('paranoid: false 查找:', found2 ? found2.deleted_at : null);

    // 清理
    if (found2) await found2.destroy({ force: true });
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})(); 
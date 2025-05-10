const sequelize = require('../utils/db');

// 导入所有模型定义
const UserModel = require('./user');
const DepartmentModel = require('./department');
const RoleModel = require('./role');
const PermissionModel = require('./permission');
const UserRoleModel = require('./user_role');
const RolePermissionModel = require('./role_permission');
const DataPermissionRuleModel = require('./data_permission_rule');
const OperationLogModel = require('./operation_log');
const RefreshTokenModel = require('./refresh_token');
const DepartmentClosureModel = require('./department_closure');
const DepartmentHistoryModel = require('./department_history');
const LoginAttempt = require('./loginAttempt');

// 初始化所有模型
const User = UserModel(sequelize);
const Department = DepartmentModel(sequelize);
const Role = RoleModel(sequelize);
const Permission = PermissionModel(sequelize);
const UserRole = UserRoleModel(sequelize);
const RolePermission = RolePermissionModel(sequelize);
const DataPermissionRule = DataPermissionRuleModel(sequelize);
const OperationLog = OperationLogModel(sequelize);
const RefreshToken = RefreshTokenModel(sequelize);
const DepartmentClosure = DepartmentClosureModel(sequelize);
const DepartmentHistory = DepartmentHistoryModel(sequelize);

// 设置模型关联关系
User.belongsTo(Department, { foreignKey: 'department_id' });
Department.hasMany(User, { foreignKey: 'department_id' });

User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id' });

Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id' });

Role.hasMany(DataPermissionRule, { foreignKey: 'role_id' });
DataPermissionRule.belongsTo(Role, { foreignKey: 'role_id' });

User.hasMany(OperationLog, { foreignKey: 'user_id' });
OperationLog.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(RefreshToken, { foreignKey: 'user_id' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

Department.hasMany(DepartmentClosure, { foreignKey: 'ancestor_id', as: 'ancestors' });
Department.hasMany(DepartmentClosure, { foreignKey: 'descendant_id', as: 'descendants' });

User.hasMany(LoginAttempt, { foreignKey: 'user_id' });
LoginAttempt.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  Department,
  Role,
  Permission,
  UserRole,
  RolePermission,
  DataPermissionRule,
  OperationLog,
  RefreshToken,
  DepartmentClosure,
  DepartmentHistory,
  LoginAttempt
}; 
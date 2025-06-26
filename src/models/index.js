const sequelize = require('../config/database');

// 导入所有模型定义
const User = require('./user');
const Department = require('./department');
const Role = require('./role');
const Permission = require('./permission');
const UserRole = require('./user_role');
const RolePermission = require('./role_permission');
const DataPermissionRule = require('./data_permission_rule');
const OperationLog = require('./operation_log');
const RefreshToken = require('./refreshToken');
const DepartmentClosure = require('./department_closure');
const DepartmentHistory = require('./department_history');
const LoginAttempt = require('./loginAttempt');
const Captcha = require('./captcha');
const PasswordReset = require('./passwordReset');
const Application = require('./application');

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

User.hasMany(PasswordReset, { foreignKey: 'user_id' });
PasswordReset.belongsTo(User, { foreignKey: 'user_id' });

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
  LoginAttempt,
  Captcha,
  PasswordReset,
  Application
}; 
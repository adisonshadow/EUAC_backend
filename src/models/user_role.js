const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class UserRole extends Model {}

  UserRole.init({
    user_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      comment: '用户ID'
    },
    role_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'roles',
        key: 'role_id'
      },
      comment: '角色ID'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
      comment: '创建时间'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
      comment: '更新时间'
    }
  }, {
    sequelize,
    modelName: 'UserRole',
    tableName: 'user_roles',
    schema: 'uac',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return UserRole;
}; 
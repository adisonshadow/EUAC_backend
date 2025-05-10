const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class RolePermission extends Model {}

  RolePermission.init({
    role_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'roles',
        key: 'role_id'
      },
      comment: '角色ID'
    },
    permission_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'permissions',
        key: 'permission_id'
      },
      comment: '权限ID'
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
    modelName: 'RolePermission',
    tableName: 'role_permissions',
    schema: 'uac',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return RolePermission;
}; 
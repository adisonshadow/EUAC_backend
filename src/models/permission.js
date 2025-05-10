const { Model, DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

class Permission extends Model {
  // 软删除方法
  async softDelete() {
    this.deleted_at = new Date();
    return this.save();
  }

  // 恢复删除的方法
  async restore() {
    this.deleted_at = null;
    return this.save();
  }
}

module.exports = (sequelize) => {
  Permission.init({
    permission_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: '权限ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'name',
      comment: '权限名称'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'code',
      comment: '权限编码'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description',
      comment: '权限描述'
    },
    resource_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'resource_type',
      comment: '资源类型'
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'action',
      comment: '操作类型'
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'ACTIVE',
      field: 'status',
      comment: '权限状态：ACTIVE-启用, DISABLED-停用, ARCHIVED-归档'
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
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
      comment: '删除时间'
    }
  }, {
    sequelize,
    modelName: 'Permission',
    tableName: 'permissions',
    schema: 'uac',
    timestamps: true,
    underscored: true,
    paranoid: true, // 启用软删除
    deletedAt: 'deleted_at', // 指定软删除字段
    indexes: [
      {
        unique: true,
        fields: ['code']
      },
      {
        fields: ['deleted_at']
      },
      {
        fields: ['status']
      }
    ]
  });

  return Permission;
}; 
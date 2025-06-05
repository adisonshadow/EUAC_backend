const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Permission extends Model {}

Permission.init({
  permission_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: '权限ID'
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
  actions: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'actions',
    comment: '操作类型列表',
    defaultValue: []
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'ACTIVE',
    field: 'status',
    comment: '权限状态'
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
  paranoid: true,
  deletedAt: 'deleted_at',
  indexes: [
    {
      unique: true,
      fields: ['code']
    }
  ]
});

module.exports = Permission; 
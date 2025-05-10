const { Model, DataTypes } = require('sequelize');

class DataPermissionRule extends Model {
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
  DataPermissionRule.init({
    rule_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: '规则ID'
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'role_id'
      },
      comment: '角色ID'
    },
    resource_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'resource_type',
      comment: '资源类型'
    },
    conditions: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'conditions',
      comment: '数据权限条件（JSON格式）'
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'ACTIVE',
      field: 'status',
      comment: '规则状态：ACTIVE-启用, DISABLED-停用, ARCHIVED-归档'
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
    modelName: 'DataPermissionRule',
    tableName: 'data_permission_rules',
    schema: 'uac',
    timestamps: true,
    underscored: true,
    paranoid: true,
    deletedAt: 'deleted_at',
    indexes: [
      {
        fields: ['role_id']
      },
      {
        fields: ['deleted_at']
      },
      {
        fields: ['status']
      }
    ]
  });

  return DataPermissionRule;
}; 
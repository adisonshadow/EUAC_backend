const { Model, DataTypes } = require('sequelize');

class OperationLog extends Model {}

module.exports = (sequelize) => {
  OperationLog.init({
    log_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: '日志ID'
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      comment: '用户ID'
    },
    operation_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'operation_type',
      comment: '操作类型'
    },
    resource_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'resource_type',
      comment: '资源类型'
    },
    resource_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'resource_id',
      comment: '资源ID'
    },
    old_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'old_data',
      comment: '旧数据'
    },
    new_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'new_data',
      comment: '新数据'
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'SUCCESS',
      field: 'status',
      comment: '操作状态：SUCCESS-成功, FAILED-失败, PENDING-处理中'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message',
      comment: '错误信息'
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
    modelName: 'OperationLog',
    tableName: 'operation_logs',
    schema: 'uac',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['resource_type', 'resource_id']
      },
      {
        fields: ['status']
      }
    ]
  });

  return OperationLog;
}; 
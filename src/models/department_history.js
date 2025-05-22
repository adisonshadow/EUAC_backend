const { Model, DataTypes } = require('sequelize');

class DepartmentHistory extends Model {}

module.exports = (sequelize) => {
  DepartmentHistory.init({
    history_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '历史ID'
    },
    department_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '部门ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '部门名称'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '部门编码'
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '父部门ID'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '部门状态'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '部门描述'
    },
    valid_from: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '生效时间'
    },
    valid_to: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '失效时间'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '创建时间'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '更新时间'
    }
  }, {
    sequelize,
    modelName: 'DepartmentHistory',
    tableName: 'department_history',
    schema: 'uac',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return DepartmentHistory;
}; 
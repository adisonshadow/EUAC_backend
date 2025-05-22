const { Model, DataTypes } = require('sequelize');

class DepartmentClosure extends Model {}

module.exports = (sequelize) => {
  DepartmentClosure.init({
    ancestor_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'departments',
        key: 'department_id'
      },
      comment: '祖先部门ID'
    },
    descendant_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: 'departments',
        key: 'department_id'
      },
      comment: '后代部门ID'
    },
    depth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'depth',
      comment: '层级深度'
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
    modelName: 'DepartmentClosure',
    tableName: 'department_closure',
    schema: 'uac',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      {
        fields: ['ancestor_id']
      },
      {
        fields: ['descendant_id']
      }
    ]
  });

  return DepartmentClosure;
}; 
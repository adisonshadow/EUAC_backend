const { Model, DataTypes } = require('sequelize');

class Department extends Model {
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
  Department.init({
    department_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '部门ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'name',
      comment: '部门名称'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'code',
      comment: '部门编码'
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'parent_id',
      comment: '父部门ID'
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'ACTIVE',
      field: 'status',
      comment: '部门状态'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description',
      comment: '部门描述'
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
    modelName: 'Department',
    tableName: 'departments',
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
      }
    ]
  });

  // 自引用关系
  Department.hasMany(Department, {
    as: 'children',
    foreignKey: 'parent_id'
  });

  Department.belongsTo(Department, {
    as: 'parent',
    foreignKey: 'parent_id'
  });

  return Department;
}; 
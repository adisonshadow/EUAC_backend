const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { logger } = require('../utils/logger');

class User extends Model {
  static async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  }

  // 软删除方法
  async softDelete() {
    const now = new Date();
    await this.update({
      status: 'ARCHIVED'
    });
    await this.destroy();
    return this;
  }

  // 恢复删除的方法
  static async restore(instance) {
    if (!instance) {
      throw new Error('Instance is required');
    }

    // 使用 Sequelize 的 restore 方法恢复记录
    await instance.restore();
    
    // 更新状态为 ACTIVE
    await instance.update({
      status: 'ACTIVE'
    });

    // 重新加载实例以获取最新数据
    await instance.reload();
    
    return instance;
  }
}

module.exports = (sequelize) => {
  User.init({
    user_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      comment: '用户ID'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'username',
      comment: '用户名'
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
      comment: '密码哈希'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'email',
      comment: '用户邮箱'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'phone',
      comment: '用户电话'
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'department_id',
      comment: '部门ID'
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'ACTIVE',
      field: 'status',
      comment: '用户状态：ACTIVE-启用, DISABLED-停用, LOCKED-锁定, ARCHIVED-离职归档'
    },
    last_password_updated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'last_password_updated',
      comment: '最后密码更新时间'
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
    modelName: 'User',
    tableName: 'users',
    schema: 'uac',
    timestamps: true,
    underscored: true,
    paranoid: true, // 启用软删除
    deletedAt: 'deleted_at', // 指定软删除字段
    scopes: {
      active: {
        where: {
          deleted_at: null,
          status: 'ACTIVE'
        }
      }
    },
    indexes: [
      {
        unique: true,
        fields: ['username']
      },
      {
        fields: ['email']
      },
      {
        fields: ['department_id']
      },
      {
        fields: ['deleted_at']
      }
    ]
  });

  return User;
}; 
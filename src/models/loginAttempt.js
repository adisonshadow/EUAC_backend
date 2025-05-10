// 登录尝试模型

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

class LoginAttempt extends Model {}

LoginAttempt.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'user_id'
        }
    },
    attempt_time: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    success: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'LoginAttempt',
    tableName: 'login_attempts',
    schema: 'uac',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = LoginAttempt; 
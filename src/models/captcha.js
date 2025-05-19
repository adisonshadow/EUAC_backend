const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Captcha extends Model {}

  Captcha.init({
    captcha_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    bg_url: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    puzzle_url: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    target_x: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    target_y: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'USED', 'EXPIRED'),
      defaultValue: 'ACTIVE'
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Captcha',
    tableName: 'captchas',
    schema: 'uac',
    timestamps: false
  });

  return Captcha;
}; 
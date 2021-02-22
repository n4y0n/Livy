'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LoginInformation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  LoginInformation.init({
    api: DataTypes.ENUM('anilist', 'myanimelist'),
    access_token: DataTypes.STRING,
    refresh_token: DataTypes.STRING,
    access_expire: DataTypes.DATE,
    refresh_expire: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'LoginInformation',
  });
  return LoginInformation;
};
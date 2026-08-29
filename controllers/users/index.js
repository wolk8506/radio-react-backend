const getCurrent = require("./getCurrent");
const updateSubscription = require("./updateSubscription");
const updateAvatar = require("./updateAvatar");
const verifyEmail = require("./verifyEmail");
const resendVerifyEmail = require("./resendVerifyEmail");
const updateName = require("./updateName");
const updateEmail = require("./updateEmail");
const changePassword = require("./changePassword");
const admin = require("./admin");
const { getCities, addCity, removeCity, setHomeCity } = require("./cities");

module.exports = {
  getCurrent,
  updateSubscription,
  updateAvatar,
  verifyEmail,
  resendVerifyEmail,
  updateName,
  updateEmail,
  changePassword,
  admin,
  getCities,
  addCity,
  removeCity,
  setHomeCity,
};

const register = require("./register");
const login = require("./login");
const logout = require("./logout");
const { googleInit, googleConnectInit, googleCallback } = require("./google");

module.exports = {
  register,
  login,
  logout,
  googleInit,
  googleConnectInit,
  googleCallback,
};

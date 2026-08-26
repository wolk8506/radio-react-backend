const { Forbidden } = require("http-errors");

const admin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return next(new Forbidden("Доступ только для администратора"));
  }
  next();
};

module.exports = admin;

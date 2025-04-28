const { Unauthorized, BadRequest } = require("http-errors");
const bcrypt = require("bcryptjs");
const { User } = require("../../models");

const changePassword = async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;

  if (!userId || !oldPassword || !newPassword) {
    throw new BadRequest("Все поля обязательны для заполнения.");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Unauthorized("Пользователь не найден.");
  }

  if (!user.comparePassword(oldPassword)) {
    throw new Unauthorized("Старый пароль неверен.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  res.json({
    status: "success",
    code: 200,
    message: "Пароль успешно изменен.",
  });
};

module.exports = changePassword;

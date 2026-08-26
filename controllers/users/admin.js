const { User } = require("../../models");
const { NotFound } = require("http-errors");

const listUsers = async (req, res) => {
  const users = await User.find(
    {},
    "name email verify isAdmin googleId subscription avatarURL createdAt"
  ).sort({ createdAt: -1 });

  res.json({
    status: "success",
    code: 200,
    data: { users },
  });
};

const toggleRole = async (req, res) => {
  const { id } = req.params;

  if (String(req.user._id) === id) {
    return res
      .status(400)
      .json({ message: "Нельзя изменить права собственной учётной записи" });
  }

  const user = await User.findById(id);
  if (!user) {
    throw new NotFound("Пользователь не найден");
  }

  user.isAdmin = !user.isAdmin;
  await user.save();

  res.json({
    status: "success",
    code: 200,
    data: {
      user: {
        _id: user._id,
        isAdmin: user.isAdmin,
      },
    },
  });
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (String(req.user._id) === id) {
    return res
      .status(400)
      .json({ message: "Нельзя удалить собственную учётную запись" });
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    throw new NotFound("Пользователь не найден");
  }

  res.json({
    status: "success",
    code: 200,
    message: "Пользователь удалён",
  });
};

const toggleVerify = async (req, res) => {
  const { id } = req.params;

  if (String(req.user._id) === id) {
    return res
      .status(400)
      .json({ message: "Нельзя изменить статус собственной учётной записи" });
  }

  const user = await User.findById(id);
  if (!user) {
    throw new NotFound("Пользователь не найден");
  }

  user.verify = !user.verify;
  await user.save();

  res.json({
    status: "success",
    code: 200,
    data: {
      user: {
        _id: user._id,
        verify: user.verify,
      },
    },
  });
};

module.exports = { listUsers, toggleRole, deleteUser, toggleVerify };

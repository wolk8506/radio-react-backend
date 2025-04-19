const { User } = require("../../models");

const updateName = async (req, res) => {
  const { name } = req.body;
  const { email } = req.user;

  const result = await User.findOneAndUpdate(
    { email },
    { name },
    { new: true }
  );
  res.json({
    status: "success",
    code: 200,
    data: result,
  });
};

module.exports = updateName;

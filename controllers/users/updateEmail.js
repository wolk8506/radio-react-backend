const { User } = require("../../models");
const createError = require("http-errors");

const updateEmail = async (req, res) => {
  const _email = req.body;
  const { email } = req.user;
  const userEmail = await User.findOne({ email: _email.email });

  if (userEmail) {
    const error = createError(409, `User with ${_email.email} already exist`);
    throw error;
  }

  const result = await User.findOneAndUpdate(
    { email },
    { email: _email.email },
    { new: true }
  );
  res.json({
    status: "success",
    code: 200,
    data: result,
  });
};

module.exports = updateEmail;

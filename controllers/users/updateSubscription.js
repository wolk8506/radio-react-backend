const { User } = require("../../models");

const updateSubscription = async (req, res) => {
  const { subscription } = req.body;
  const { email } = req.user;

  const result = await User.findOneAndUpdate(
    { email },
    { subscription },
    { new: true }
  );
  res.json({
    status: "success",
    code: 200,
    data: {
      result,
    },
  });
};

module.exports = updateSubscription;

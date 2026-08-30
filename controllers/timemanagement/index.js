const getTimeManagement = async (req, res) => {
  const { tasks = [], plans = [] } = req.user.timeManagement || {};
  res.json({
    status: "success",
    code: 200,
    data: { tasks, plans },
  });
};

const saveTimeManagement = async (req, res) => {
  const { tasks, plans } = req.body;

  if (!req.user.timeManagement) req.user.timeManagement = {};
  req.user.timeManagement.tasks = tasks || [];
  req.user.timeManagement.plans = plans || [];

  await req.user.save();

  res.json({
    status: "success",
    code: 200,
    data: { tasks: req.user.timeManagement.tasks, plans: req.user.timeManagement.plans },
  });
};

module.exports = { getTimeManagement, saveTimeManagement };
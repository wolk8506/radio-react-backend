const getTimeManagement = async (req, res) => {
  const { tasks = [], plans = [], todos = [] } = req.user.timeManagement || {};
  res.json({
    status: "success",
    code: 200,
    data: { tasks, plans, todos },
  });
};

const saveTimeManagement = async (req, res) => {
  const { tasks, plans, todos } = req.body;

  if (!req.user.timeManagement) req.user.timeManagement = {};
  if (tasks !== undefined) req.user.timeManagement.tasks = tasks || [];
  if (plans !== undefined) req.user.timeManagement.plans = plans || [];
  if (todos !== undefined) req.user.timeManagement.todos = todos || [];

  await req.user.save();

  res.json({
    status: "success",
    code: 200,
    data: {
      tasks: req.user.timeManagement.tasks,
      plans: req.user.timeManagement.plans,
      todos: req.user.timeManagement.todos,
    },
  });
};

module.exports = { getTimeManagement, saveTimeManagement };
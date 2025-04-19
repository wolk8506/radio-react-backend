const { Recipe } = require("../../models");
const createError = require("http-errors");

const updateRecipe = async (req, res) => {
  const { _id } = req.user;
  const { recipeId } = req.params;

  const result = await Recipe.findOneAndUpdate(
    { owner: _id, _id: recipeId },
    req.body,
    {
      new: true,
    }
  );

  if (!result) {
    throw createError(404, `Contact with id=${recipeId} not found`);
  }

  res.json({
    status: "success",
    code: 200,
    data: {
      result,
    },
  });
};

module.exports = updateRecipe;

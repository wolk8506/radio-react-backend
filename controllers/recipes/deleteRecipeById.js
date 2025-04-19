const { Recipe } = require("../../models");
const createError = require("http-errors");

const deleteRecipeById = async (req, res) => {
  const { _id } = req.user;
  const { recipeId } = req.params;

  const result = await Recipe.findOneAndRemove({
    owner: _id,
    _id: recipeId,
  });

  if (!result) {
    throw createError(404, `Recipe with id=${recipeId} not found`);
  }

  res.json({
    status: "success",
    code: 200,
    message: "Recipe deleted",
    data: {
      result,
    },
  });
};

module.exports = deleteRecipeById;

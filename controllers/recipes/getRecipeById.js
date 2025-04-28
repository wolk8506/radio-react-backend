const { Recipe } = require("../../models");
const createError = require("http-errors");

const getRecipeById = async (req, res) => {
  const { recipeId } = req.params;
  const result = await Recipe.find({ _id: recipeId });

  if (result.length === 0) {
    throw createError(404, `Recipe with id=${recipeId} not found`);
  }

  res.json({
    status: "success",
    code: 200,
    data: {
      result,
    },
  });
};

module.exports = getRecipeById;

const { Recipe } = require("../../models");
const createError = require("http-errors");

const getRecipeCategories = async (req, res) => {
  const result = await Recipe.distinct("category");

  if (result.length === 0) {
    throw createError(404, `Recipe category not found`);
  }

  res.json({
    status: "success",
    code: 200,
    data: {
      categories: result,
    },
  });
};

module.exports = getRecipeCategories;

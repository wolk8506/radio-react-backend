const { Recipe } = require("../../models");
const createError = require("http-errors");

const updateRecipeFavoriteById = async (req, res) => {
  const { _id } = req.user;
  const { recipeId } = req.params;
  const { favorite } = req.body;

  const result = await Recipe.findOneAndUpdate(
    { owner: _id, _id: recipeId },
    { favorite },
    { new: true }
  );

  if (!result) {
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

module.exports = updateRecipeFavoriteById;

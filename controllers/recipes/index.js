const addRecipe = require("./addRecipe");
const getRecipe = require("./getRecipes");
const getRecipeById = require("./getRecipeById");
const deleteRecipeById = require("./deleteRecipeById");
const updateRecipeById = require("./updateRecipeById");
const updateRecipeFavoriteById = require("./updateRecipeFavoriteById");

module.exports = {
  addRecipe,
  getRecipe,
  getRecipeById,
  deleteRecipeById,
  updateRecipeById,
  updateRecipeFavoriteById,
};

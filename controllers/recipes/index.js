const addRecipe = require("./addRecipe");
const getRecipe = require("./getRecipes");
const getRecipeCategories = require("./getRecipeCategories");
const getRecipeById = require("./getRecipeById");
const deleteRecipeById = require("./deleteRecipeById");
const updateRecipeById = require("./updateRecipeById");
const updateRecipeFavoriteById = require("./updateRecipeFavoriteById");
const removeRecipeFavoriteById = require("./removeRecipeFavoriteById");

module.exports = {
  addRecipe,
  getRecipe,
  getRecipeCategories,
  getRecipeById,
  deleteRecipeById,
  updateRecipeById,
  updateRecipeFavoriteById,
  removeRecipeFavoriteById,
};

const express = require("express");
const router = express.Router();

const { recipe: ctrl } = require("../../controllers");
const { auth, validation, ctrlWrapper } = require("../../middlewares");
const {
  recipeJoiSchema,
  favoriteRecipeJoiSchema,
} = require("../../models/recipe");

// Получение списка рецептов
router.get("/", ctrlWrapper(ctrl.getRecipe));
// Получение одного рецепта по _id
router.get("/:recipeId", ctrlWrapper(ctrl.getRecipeById));
// Создание рецепта
router.post(
  "/",
  auth,
  validation(recipeJoiSchema),
  ctrlWrapper(ctrl.addRecipe)
);
// Обновление рецепта
router.put(
  "/:recipeId",
  auth,
  validation(recipeJoiSchema),
  ctrlWrapper(ctrl.updateRecipeById)
);
// Добавление рецепта в избранное
router.patch(
  "/:recipeId/favorite",
  auth,
  validation(favoriteRecipeJoiSchema),
  ctrlWrapper(ctrl.updateRecipeFavoriteById)
);
// Удаление рецепта по _id
router.delete("/:recipeId", auth, ctrlWrapper(ctrl.deleteRecipeById));

module.exports = router;

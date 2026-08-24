const express = require("express");
const router = express.Router();

const { filmLibrary: ctrl } = require("../../controllers");
const { auth, validation, ctrlWrapper } = require("../../middlewares");
const {
  filmLibraryJoiSchema,
  movieJoiSchema,
  orderJoiSchema,
  watchedJoiSchema,
  visibilityJoiSchema,
} = require("../../models/filmLibrary");

// Получить коллекции пользователя (свои + общие)
router.get("/", auth, ctrlWrapper(ctrl.getCollections));
// Получить одну коллекцию
router.get("/:id", auth, ctrlWrapper(ctrl.getCollectionById));
// Создать коллекцию
router.post("/", auth, validation(filmLibraryJoiSchema), ctrlWrapper(ctrl.createCollection));
// Переименовать коллекцию (только владелец)
router.patch("/:id", auth, ctrlWrapper(ctrl.renameCollection));
// Удалить коллекцию (только владелец)
router.delete("/:id", auth, ctrlWrapper(ctrl.deleteCollection));
// Добавить фильм (только владелец)
router.post("/:id/movies", auth, validation(movieJoiSchema), ctrlWrapper(ctrl.addMovie));
// Удалить фильм (только владелец)
router.delete("/:id/movies/:movieId", auth, ctrlWrapper(ctrl.removeMovie));
// Изменить порядок фильмов (только владелец)
router.patch("/:id/movies/order", auth, validation(orderJoiSchema), ctrlWrapper(ctrl.reorderMovies));
// Сделать подборку общей/личной (только владелец)
router.patch(
  "/:id/visibility",
  auth,
  validation(visibilityJoiSchema),
  ctrlWrapper(ctrl.setVisibility),
);
// Отметить «просмотрено» (доступно любому зрителю общей коллекции)
router.patch(
  "/:id/movies/:movieId/watched",
  auth,
  validation(watchedJoiSchema),
  ctrlWrapper(ctrl.setWatched),
);

module.exports = router;

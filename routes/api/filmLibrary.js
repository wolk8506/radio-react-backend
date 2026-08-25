const express = require("express");
const router = express.Router();

const { filmLibrary: ctrl } = require("../../controllers");
const { auth, validation, ctrlWrapper } = require("../../middlewares");
const {
  createCollectionJoiSchema,
  renameCollectionJoiSchema,
  visibilityJoiSchema,
  watchedJoiSchema,
  reorderJoiSchema,
  addMovieJoiSchema,
} = require("../../models/filmLibrary");

router.get("/", auth, ctrlWrapper(ctrl.getCollections));
router.post(
  "/",
  auth,
  validation(createCollectionJoiSchema),
  ctrlWrapper(ctrl.createCollection)
);
router.get("/:id", auth, ctrlWrapper(ctrl.getCollectionById));
router.patch(
  "/:id",
  auth,
  validation(renameCollectionJoiSchema),
  ctrlWrapper(ctrl.renameCollection)
);
router.patch(
  "/:id/visibility",
  auth,
  validation(visibilityJoiSchema),
  ctrlWrapper(ctrl.setVisibility)
);
router.delete("/:id", auth, ctrlWrapper(ctrl.deleteCollection));
router.post(
  "/:id/movies",
  auth,
  validation(addMovieJoiSchema),
  ctrlWrapper(ctrl.addMovie)
);
router.delete("/:id/movies/:movieId", auth, ctrlWrapper(ctrl.removeMovie));
router.patch(
  "/:id/movies/order",
  auth,
  validation(reorderJoiSchema),
  ctrlWrapper(ctrl.reorderMovies)
);
router.patch(
  "/:id/movies/:movieId/watched",
  auth,
  validation(watchedJoiSchema),
  ctrlWrapper(ctrl.setWatched)
);

module.exports = router;

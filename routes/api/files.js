const express = require("express");
const router = express.Router();
const { files: ctrl } = require("../../controllers");
const { ctrlWrapper, multer } = require("../../middlewares");
const { ensureValidToken } = require("../../middlewares/refreshTokenDropBox");

router.get("/recipe/:fileId", ensureValidToken, ctrlWrapper(ctrl.getImgById)); // Обновляем токен перед запросом
router.get(
  "/avatars/:fileId",
  ensureValidToken,
  ctrlWrapper(ctrl.getAvatarsById)
); // Обновляем токен перед запросом
router.get(
  "/walpaper/:fileId",
  ensureValidToken,
  ctrlWrapper(ctrl.getWalpaperById)
); // Обновляем токен перед запросом
router.post(
  "/walpaper",
  ensureValidToken,
  multer.single("file"),
  ctrlWrapper(ctrl.uploadWalpaper)
);
router.post(
  "/upload",
  ensureValidToken,
  multer.array("files", 20),
  ctrlWrapper(ctrl.upload)
);
router.delete("/delete", ensureValidToken, ctrlWrapper(ctrl.deleteFile));

module.exports = router;

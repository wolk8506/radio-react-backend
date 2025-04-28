const express = require("express");
const router = express.Router();

const { users: ctrl } = require("../../controllers");
const { auth, upload, validation, ctrlWrapper } = require("../../middlewares");
const { ensureValidToken } = require("../../middlewares/refreshTokenDropBox");
const {
  joiSubscriptionSchema,
  joiResendVerifyEmailSchema,
  joiUpdateNameSchema,
  joiUpdateEmailSchema,
  joiChangePasswordSchema,
} = require("../../models/user");

router.get("/current", auth, ctrlWrapper(ctrl.getCurrent));

router.post(
  "/change-password",
  auth,
  validation(joiChangePasswordSchema),
  ctrlWrapper(ctrl.changePassword)
);

router.patch(
  "/subscription",
  auth,
  validation(joiSubscriptionSchema),
  ctrlWrapper(ctrl.updateSubscription)
);

router.patch(
  "/avatars",
  auth,
  ensureValidToken,
  upload.single("avatar"),
  ctrlWrapper(ctrl.updateAvatar)
);

router.patch(
  "/name",
  auth,
  validation(joiUpdateNameSchema),
  ctrlWrapper(ctrl.updateName)
);

router.patch(
  "/email",
  auth,
  validation(joiUpdateEmailSchema),
  ctrlWrapper(ctrl.updateEmail)
);

router.get("/verify/:verificationToken", ctrlWrapper(ctrl.verifyEmail));
router.post(
  "/verify",
  validation(joiResendVerifyEmailSchema),
  ctrlWrapper(ctrl.resendVerifyEmail)
);

module.exports = router;

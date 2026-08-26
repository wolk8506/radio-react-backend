const express = require("express");
const router = express.Router();

const { users: ctrl } = require("../../controllers");
const { listUsers, toggleRole, deleteUser, toggleVerify } = require("../../controllers/users/admin");
const {
  auth,
  admin,
  upload,
  validation,
  ctrlWrapper,
} = require("../../middlewares");
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

router.get(
  "/admin/users",
  auth,
  admin,
  ctrlWrapper(listUsers)
);
router.patch(
  "/admin/:id/role",
  auth,
  admin,
  ctrlWrapper(toggleRole)
);
router.delete(
  "/admin/:id",
  auth,
  admin,
  ctrlWrapper(deleteUser)
);
router.patch(
  "/admin/:id/verify",
  auth,
  admin,
  ctrlWrapper(toggleVerify)
);

module.exports = router;

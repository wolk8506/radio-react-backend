const express = require("express");
const router = express.Router();

const { auth: ctrl } = require("../../controllers");
const { auth, validation, ctrlWrapper } = require("../../middlewares");
const { joiRegisterSchema, joiLoginSchema } = require("../../models/user");

router.post(
  "/register",
  validation(joiRegisterSchema),
  ctrlWrapper(ctrl.register)
);

router.post("/login", validation(joiLoginSchema), ctrlWrapper(ctrl.login));

router.get("/google", ctrlWrapper(ctrl.googleInit));
router.post("/google/connect/init", auth, ctrlWrapper(ctrl.googleConnectInit));
router.get("/google/callback", ctrlWrapper(ctrl.googleCallback));

router.get("/logout", auth, ctrlWrapper(ctrl.logout));

module.exports = router;

const express = require("express");
const router = express.Router();

const { timemanagement: ctrl } = require("../../controllers");
const { auth, ctrlWrapper } = require("../../middlewares");

router.get("/", auth, ctrlWrapper(ctrl.getTimeManagement));

router.put("/", auth, ctrlWrapper(ctrl.saveTimeManagement));

module.exports = router;
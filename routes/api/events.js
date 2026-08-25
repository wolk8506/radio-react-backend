const express = require("express");
const router = express.Router();

const { events: ctrl } = require("../../controllers");
const { auth, validation, ctrlWrapper } = require("../../middlewares");
const {
  createEventJoiSchema,
  updateEventJoiSchema,
} = require("../../models/event");

router.get("/", auth, ctrlWrapper(ctrl.getEvents));
router.post(
  "/",
  auth,
  validation(createEventJoiSchema),
  ctrlWrapper(ctrl.createEvent)
);
router.get("/:id", auth, ctrlWrapper(ctrl.getEventById));
router.patch(
  "/:id",
  auth,
  validation(updateEventJoiSchema),
  ctrlWrapper(ctrl.updateEvent)
);
router.delete("/:id", auth, ctrlWrapper(ctrl.deleteEvent));

module.exports = router;

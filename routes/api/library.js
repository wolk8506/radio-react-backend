const express = require("express");
const router = express.Router();

const { facts, jokes, events } = require("../../controllers/library");
const { auth, admin, validation, ctrlWrapper } = require("../../middlewares");
const {
  joiFactSchema,
  joiJokeSchema,
  joiEventItemSchema,
  joiFactUpdateSchema,
  joiJokeUpdateSchema,
  joiEventItemUpdateSchema,
} = require("../../models/library");

//  ~ События календаря  ------------------------------------------------------------------------
router.get("/events", ctrlWrapper(events.list));
router.post(
  "/events",
  auth,
  admin,
  validation(joiEventItemSchema),
  ctrlWrapper(events.add)
);
router.patch(
  "/events/:id",
  auth,
  admin,
  validation(joiEventItemUpdateSchema),
  ctrlWrapper(events.update)
);
router.delete("/events/:id", auth, admin, ctrlWrapper(events.remove));

//  ~ Факты  ------------------------------------------------------------------------------------
router.get("/facts", ctrlWrapper(facts.list));
router.post(
  "/facts",
  auth,
  admin,
  validation(joiFactSchema),
  ctrlWrapper(facts.add)
);
router.patch(
  "/facts/:id",
  auth,
  admin,
  validation(joiFactUpdateSchema),
  ctrlWrapper(facts.update)
);
router.delete("/facts/:id", auth, admin, ctrlWrapper(facts.remove));

//  ~ Шутки  ------------------------------------------------------------------------------------
router.get("/jokes/random", ctrlWrapper(jokes.random));
router.get("/jokes", ctrlWrapper(jokes.list));
router.post(
  "/jokes",
  auth,
  admin,
  validation(joiJokeSchema),
  ctrlWrapper(jokes.add)
);
router.patch(
  "/jokes/:id",
  auth,
  admin,
  validation(joiJokeUpdateSchema),
  ctrlWrapper(jokes.update)
);
router.delete("/jokes/:id", auth, admin, ctrlWrapper(jokes.remove));

module.exports = router;

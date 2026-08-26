const express = require("express");
const router = express.Router();

const news = require("../../controllers/news");
const { auth, admin, validation, ctrlWrapper } = require("../../middlewares");
const { joiNewsSource, joiNewsSourceUpdate } = require("../../models/newsModels");

// Лента и фасеты — доступны и без авторизации (вернёт общую ленту по дате).
router.get("/feed", ctrlWrapper(news.list));
router.get("/facets", ctrlWrapper(news.facets));

// Интересы — только для авторизованного пользователя.
router.get("/interests", auth, ctrlWrapper(news.getInterests));
router.put("/interests", auth, ctrlWrapper(news.updateInterests));

// Источники — только админ.
router.get("/sources", auth, admin, ctrlWrapper(news.listSources));
router.post("/sources", auth, admin, validation(joiNewsSource), ctrlWrapper(news.addSource));
router.patch(
  "/sources/:id",
  auth,
  admin,
  validation(joiNewsSourceUpdate),
  ctrlWrapper(news.updateSource)
);
router.delete("/sources/:id", auth, admin, ctrlWrapper(news.removeSource));

module.exports = router;

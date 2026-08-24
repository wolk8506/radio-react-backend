const { FilmLibrary } = require("../../models");
const { serializeCollection } = require("./serialize");

// Изменить флаг общедоступности (только владелец)
const setVisibility = async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;
  const { isPublic } = req.body;
  const collection = await FilmLibrary.findById(id);
  if (!collection || String(collection.owner) !== String(_id)) {
    return res.status(404).json({ status: "error", code: 404, message: "Not found" });
  }
  collection.isPublic = !!isPublic;
  await collection.save();
  res.json({ status: "success", code: 200, data: { result: serializeCollection(collection) } });
};

module.exports = setVisibility;

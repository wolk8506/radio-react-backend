const { FilmLibrary } = require("../../models");
const { serializeCollection } = require("./serialize");

const renameCollection = async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;
  const { name } = req.body;
  const collection = await FilmLibrary.findById(id);
  if (!collection || String(collection.owner) !== String(_id)) {
    return res.status(404).json({ status: "error", code: 404, message: "Not found" });
  }
  collection.name = name.trim();
  await collection.save();
  res.json({ status: "success", code: 200, data: { result: serializeCollection(collection) } });
};

module.exports = renameCollection;

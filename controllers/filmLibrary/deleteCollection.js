const { FilmLibrary } = require("../../models");
const { serializeCollection } = require("./serialize");

const deleteCollection = async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;
  const collection = await FilmLibrary.findById(id);
  if (!collection || String(collection.owner) !== String(_id)) {
    return res.status(404).json({ status: "error", code: 404, message: "Not found" });
  }
  await FilmLibrary.findByIdAndDelete(id);
  const remaining = await FilmLibrary.find({
    $or: [{ owner: _id }, { isPublic: true }],
  });
  res.json({
    status: "success",
    code: 200,
    data: { result: remaining.map(serializeCollection) },
  });
};

module.exports = deleteCollection;

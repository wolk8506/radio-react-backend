const { FilmLibrary } = require("../../models");
const { serializeCollection } = require("./serialize");

const reorderMovies = async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;
  const { orderedIds } = req.body;
  const collection = await FilmLibrary.findById(id);
  if (!collection || String(collection.owner) !== String(_id)) {
    return res.status(404).json({ status: "error", code: 404, message: "Not found" });
  }
  const byId = Object.fromEntries(collection.movies.map(m => [String(m.tmdbId), m]));
  collection.movies = orderedIds.map(tid => byId[String(tid)]).filter(Boolean);
  await collection.save();
  res.json({ status: "success", code: 200, data: { result: serializeCollection(collection) } });
};

module.exports = reorderMovies;

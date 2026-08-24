const { FilmLibrary } = require("../../models");
const { serializeCollection } = require("./serialize");

const removeMovie = async (req, res) => {
  const { id, movieId } = req.params;
  const { _id } = req.user;
  const collection = await FilmLibrary.findById(id);
  if (!collection || String(collection.owner) !== String(_id)) {
    return res.status(404).json({ status: "error", code: 404, message: "Not found" });
  }
  collection.movies = collection.movies.filter(x => String(x.tmdbId) !== String(movieId));
  await collection.save();
  res.json({ status: "success", code: 200, data: { result: serializeCollection(collection) } });
};

module.exports = removeMovie;

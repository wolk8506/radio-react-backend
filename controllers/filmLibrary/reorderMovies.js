const { FilmLibrary } = require("../../models");
const { serializeCollection } = require("./serialize");
const { NotFound, Forbidden } = require("http-errors");

const reorderMovies = async (req, res) => {
  const { id } = req.params;
  const { orderedIds = [] } = req.body;
  const userId = req.user._id;

  const collection = await FilmLibrary.findById(id);
  if (!collection) throw new NotFound("Not found");

  if (!collection.owner.equals(userId)) {
    throw new Forbidden("Access denied");
  }

  const ids = orderedIds.map(Number);
  const byTmdbId = new Map(collection.movies.map(m => [m.tmdbId, m]));
  const reordered = ids.map(tid => byTmdbId.get(tid)).filter(Boolean);
  const remaining = collection.movies.filter(m => !ids.includes(m.tmdbId));

  collection.movies = [...reordered, ...remaining];
  await collection.save();

  res.json({
    status: "success",
    code: 200,
    data: { result: serializeCollection(collection) },
  });
};

module.exports = reorderMovies;

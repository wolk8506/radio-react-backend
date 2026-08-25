const { FilmLibrary } = require("../../models");
const { serializeCollection } = require("./serialize");
const { NotFound, Forbidden } = require("http-errors");

const setWatched = async (req, res) => {
  const { id, movieId } = req.params;
  const { watched } = req.body;
  const userId = req.user._id;

  const collection = await FilmLibrary.findById(id);
  if (!collection) throw new NotFound("Not found");

  if (!collection.isPublic && !collection.owner.equals(userId)) {
    throw new Forbidden("Access denied");
  }

  const movie = collection.movies.find(m => m.tmdbId === Number(movieId));
  if (!movie) throw new NotFound("Movie not found");

  const uid = userId.toString();
  const idx = movie.watchedBy.findIndex(u => u.toString() === uid);

  if (watched && idx === -1) {
    movie.watchedBy.push(userId);
  }
  if (!watched && idx !== -1) {
    movie.watchedBy.splice(idx, 1);
  }

  await collection.save();

  res.json({
    status: "success",
    code: 200,
    data: { result: serializeCollection(collection) },
  });
};

module.exports = setWatched;

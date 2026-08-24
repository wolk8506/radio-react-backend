const { FilmLibrary } = require("../../models");
const { serializeCollection } = require("./serialize");

// Отметка «просмотрено» персональная: меняет только запись текущего пользователя
const setWatched = async (req, res) => {
  const { id, movieId } = req.params;
  const { _id } = req.user;
  const { watched } = req.body;
  const collection = await FilmLibrary.findById(id);
  if (!collection || (String(collection.owner) !== String(_id) && !collection.isPublic)) {
    return res.status(404).json({ status: "error", code: 404, message: "Not found" });
  }
  const movie = collection.movies.find(x => String(x.tmdbId) === String(movieId));
  if (!movie) {
    return res.status(404).json({ status: "error", code: 404, message: "Movie not found" });
  }
  if (watched) {
    if (!movie.watchedBy.some(u => String(u) === String(_id))) {
      movie.watchedBy.push(_id);
    }
  } else {
    movie.watchedBy = movie.watchedBy.filter(u => String(u) !== String(_id));
  }
  await collection.save();
  res.json({ status: "success", code: 200, data: { result: serializeCollection(collection) } });
};

module.exports = setWatched;

const { FilmLibrary } = require("../../models");
const { serializeCollection } = require("./serialize");

const addMovie = async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;
  const m = req.body;
  const collection = await FilmLibrary.findById(id);
  if (!collection || String(collection.owner) !== String(_id)) {
    return res.status(404).json({ status: "error", code: 404, message: "Not found" });
  }
  if (collection.movies.some(x => x.tmdbId === m.id)) {
    return res.json({ status: "success", code: 200, data: { result: serializeCollection(collection) } });
  }
  collection.movies.push({
    tmdbId: m.id,
    title: m.title,
    poster_path: m.poster_path ?? null,
    release_date: m.release_date ?? "",
    vote_average: m.vote_average ?? 0,
    genre_ids: m.genre_ids ?? [],
    overview: m.overview ?? "",
    media_type: m.media_type ?? "movie",
    watchedBy: [],
  });
  await collection.save();
  res.status(201).json({ status: "success", code: 201, data: { result: serializeCollection(collection) } });
};

module.exports = addMovie;

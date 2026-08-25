const { FilmLibrary } = require("../../models");
const { serializeCollection } = require("./serialize");
const { NotFound, Forbidden } = require("http-errors");

const addMovie = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const input = req.body || {};

  const collection = await FilmLibrary.findById(id);
  if (!collection) throw new NotFound("Not found");

  if (!collection.owner.equals(userId)) {
    throw new Forbidden("Access denied");
  }

  const tmdbId = input.tmdbId ?? input.id;
  if (tmdbId === undefined || tmdbId === null) {
    throw new Forbidden("Movie id is required");
  }

  if (collection.movies.some(m => m.tmdbId === Number(tmdbId))) {
    return res.json({
      status: "success",
      code: 200,
      data: { result: serializeCollection(collection) },
    });
  }

  collection.movies.push({
    tmdbId: Number(tmdbId),
    title: input.title,
    poster_path: input.poster_path,
    release_date: input.release_date,
    vote_average: input.vote_average,
    genre_ids: input.genre_ids || [],
    overview: input.overview,
    media_type: input.media_type || "movie",
    watchedBy: [],
  });

  await collection.save();

  res.status(201).json({
    status: "success",
    code: 201,
    data: { result: serializeCollection(collection) },
  });
};

module.exports = addMovie;

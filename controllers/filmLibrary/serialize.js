const serializeMovie = m => ({
  id: m.tmdbId,
  tmdbId: m.tmdbId,
  title: m.title,
  poster_path: m.poster_path,
  release_date: m.release_date,
  vote_average: m.vote_average,
  genre_ids: m.genre_ids || [],
  overview: m.overview,
  media_type: m.media_type || "movie",
  watchedBy: (m.watchedBy || []).map(id => id.toString()),
});

const serializeCollection = c => ({
  id: c._id.toString(),
  name: c.name,
  ownerId: c.owner.toString(),
  isPublic: c.isPublic,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
  movies: (c.movies || []).map(serializeMovie),
});

module.exports = { serializeCollection, serializeMovie };

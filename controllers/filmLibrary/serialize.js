const serializeMovie = m => ({
  id: m.tmdbId,
  title: m.title,
  poster_path: m.poster_path,
  release_date: m.release_date,
  vote_average: m.vote_average,
  genre_ids: m.genre_ids,
  overview: m.overview,
  media_type: m.media_type,
  watchedBy: (m.watchedBy || []).map(String),
});

const serializeCollection = c => ({
  id: String(c._id),
  name: c.name,
  ownerId: String(c.owner),
  isPublic: c.isPublic,
  createdAt: c.createdAt,
  movies: (c.movies || []).map(serializeMovie),
});

module.exports = { serializeCollection, serializeMovie };

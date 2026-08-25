const { Schema, model } = require("mongoose");
const Joi = require("joi");

const movieSchema = new Schema(
  {
    tmdbId: { type: Number, required: true },
    title: { type: String },
    poster_path: { type: String },
    release_date: { type: String },
    vote_average: { type: Number },
    genre_ids: { type: [Number], default: [] },
    overview: { type: String },
    media_type: { type: String, enum: ["movie", "tv"], default: "movie" },
    watchedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { _id: false }
);

const filmLibrarySchema = new Schema(
  {
    name: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isPublic: { type: Boolean, default: false },
    movies: [movieSchema],
  },
  { versionKey: false, timestamps: true }
);

const FilmLibrary = model("FilmLibrary", filmLibrarySchema);

const createCollectionJoiSchema = Joi.object({
  name: Joi.string().required(),
  isPublic: Joi.boolean(),
});

const renameCollectionJoiSchema = Joi.object({
  name: Joi.string().required(),
});

const visibilityJoiSchema = Joi.object({
  isPublic: Joi.boolean().required(),
});

const watchedJoiSchema = Joi.object({
  watched: Joi.boolean().required(),
});

const reorderJoiSchema = Joi.object({
  orderedIds: Joi.array().items(Joi.number(), Joi.string()).required(),
});

const addMovieJoiSchema = Joi.object({
  id: Joi.number(),
  tmdbId: Joi.number(),
  title: Joi.string(),
}).unknown(true);

module.exports = {
  FilmLibrary,
  createCollectionJoiSchema,
  renameCollectionJoiSchema,
  visibilityJoiSchema,
  watchedJoiSchema,
  reorderJoiSchema,
  addMovieJoiSchema,
};

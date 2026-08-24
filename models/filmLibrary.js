const { Schema, model } = require("mongoose");
const Joi = require("joi");

// Вложенный документ фильма в подборке
const movieSchema = new Schema(
  {
    tmdbId: { type: Number, required: true }, // id фильма из TMDB (используется как movie.id на фронте)
    title: { type: String, default: "" },
    poster_path: { type: String, default: null },
    release_date: { type: String, default: "" },
    vote_average: { type: Number, default: 0 },
    genre_ids: { type: [Number], default: [] },
    overview: { type: String, default: "" },
    media_type: { type: String, enum: ["movie", "tv"], default: "movie" },
    // кто отметил «просмотрено» — персональная отметка
    watchedBy: [{ type: Schema.Types.ObjectId, ref: "user" }],
  },
  { _id: false }
);

// Коллекция (подборка) фильмов
const filmLibrarySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: "user", required: true },
    isPublic: { type: Boolean, default: false }, // false = личная, true = общая
    movies: { type: [movieSchema], default: [] },
  },
  { timestamps: true }
);

const FilmLibrary = model("filmLibrary", filmLibrarySchema);

const filmLibraryJoiSchema = Joi.object({
  name: Joi.string()
    .required()
    .messages({ "any.required": "Название подборки обязательно." }),
  isPublic: Joi.boolean().default(false),
});

const movieJoiSchema = Joi.object({
  id: Joi.number().required(),
  title: Joi.string().allow("").default(""),
  poster_path: Joi.any().default(null),
  release_date: Joi.any().default(""),
  vote_average: Joi.any().default(0),
  genre_ids: Joi.any().default([]),
  overview: Joi.any().default(""),
  media_type: Joi.any().default("movie"),
}).unknown(true);

const orderJoiSchema = Joi.object({
  orderedIds: Joi.array().items(Joi.number()).required(),
});

const watchedJoiSchema = Joi.object({
  watched: Joi.boolean().required(),
});

module.exports = {
  FilmLibrary,
  filmLibraryJoiSchema,
  movieJoiSchema,
  orderJoiSchema,
  watchedJoiSchema,
};

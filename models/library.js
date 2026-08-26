const { Schema, model } = require("mongoose");
const Joi = require("joi");

// Дата в формате "MM-DD" (как в исходном events.json)
const dateRegex = /^\d{2}-\d{2}$/;

//  ~ Факты (текст по дате)  --------------------------------------------------------------------
const factSchema = new Schema(
  {
    date: { type: String, required: true, match: dateRegex },
    text: { type: String, required: true },
  },
  { versionKey: false, timestamps: true }
);

//  ~ Шутки (произвольный текст, без привязки к дате)  ------------------------------------------
const jokeSchema = new Schema(
  {
    text: { type: String, required: true },
  },
  { versionKey: false, timestamps: true }
);

//  ~ События календаря (по дате, с названием/описанием/эмодзи)  ---------------------------------
const eventItemSchema = new Schema(
  {
    date: { type: String, required: true, match: dateRegex },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    emoji: { type: String, default: "" },
  },
  { versionKey: false, timestamps: true }
);

const Fact = model("fact", factSchema);
const Joke = model("joke", jokeSchema);
const EventItem = model("eventItem", eventItemSchema);

const joiFactSchema = Joi.object({
  date: Joi.string().pattern(dateRegex).required(),
  text: Joi.string().required(),
});

const joiJokeSchema = Joi.object({
  text: Joi.string().required(),
});

const joiEventItemSchema = Joi.object({
  date: Joi.string().pattern(dateRegex).required(),
  title: Joi.string().required(),
  description: Joi.string().allow(""),
  emoji: Joi.string().allow(""),
});

const joiFactUpdateSchema = Joi.object({
  date: Joi.string().pattern(dateRegex),
  text: Joi.string(),
}).min(1);

const joiJokeUpdateSchema = Joi.object({
  text: Joi.string(),
}).min(1);

const joiEventItemUpdateSchema = Joi.object({
  date: Joi.string().pattern(dateRegex),
  title: Joi.string(),
  description: Joi.string().allow(""),
  emoji: Joi.string().allow(""),
}).min(1);

module.exports = {
  Fact,
  Joke,
  EventItem,
  joiFactSchema,
  joiJokeSchema,
  joiEventItemSchema,
  joiFactUpdateSchema,
  joiJokeUpdateSchema,
  joiEventItemUpdateSchema,
};

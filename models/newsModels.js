const { Schema, model } = require("mongoose");
const Joi = require("joi");

//  ~ Источник (RSS-лента, общий список, управляется админом)  --------------------------------
const newsSourceSchema = new Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ["rss", "telegram"], default: "rss" },
    category: { type: String, default: "general" },
    active: { type: Boolean, default: true },
    lastFetched: { type: Date },
    lastError: { type: String },
  },
  { versionKey: false, timestamps: true }
);

//  ~ Новость (после обработки LLM)  ------------------------------------------------------------
const newsItemSchema = new Schema(
  {
    source: { type: Schema.Types.ObjectId, ref: "newsSource", required: true },
    link: { type: String, required: true, unique: true },
    guid: { type: String },
    title: { type: String, required: true },
    content: { type: String, default: "" },
    summary: { type: String, default: "" },
    category: { type: String, default: "general" },
    tags: { type: [String], default: [] },
    author: { type: String },
    publishedAt: { type: Date },
    processed: { type: Boolean, default: false },
  },
  { versionKey: false, timestamps: true }
);

newsItemSchema.index({ publishedAt: -1 });
newsItemSchema.index({ category: 1 });
newsItemSchema.index({ tags: 1 });

//  ~ Профиль интересов пользователя (для персонализации)  -------------------------------------
const interestTagSchema = new Schema(
  {
    tag: { type: String, required: true },
    weight: { type: Number, default: 1, min: 0, max: 10 },
  },
  { _id: false }
);

const userInterestSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "user", required: true, unique: true },
    tags: { type: [interestTagSchema], default: [] },
    categories: { type: [String], default: [] },
  },
  { versionKey: false, timestamps: true }
);

const NewsSource = model("newsSource", newsSourceSchema);
const NewsItem = model("newsItem", newsItemSchema);
const UserInterest = model("userInterest", userInterestSchema);

const joiNewsSource = Joi.object({
  title: Joi.string().required(),
  url: Joi.string().uri().required(),
  type: Joi.string().valid("rss", "telegram"),
  category: Joi.string().allow(""),
});

const joiNewsSourceUpdate = Joi.object({
  title: Joi.string(),
  url: Joi.string().uri(),
  type: Joi.string().valid("rss", "telegram"),
  category: Joi.string().allow(""),
  active: Joi.boolean(),
}).min(1);

module.exports = {
  NewsSource,
  NewsItem,
  UserInterest,
  joiNewsSource,
  joiNewsSourceUpdate,
};

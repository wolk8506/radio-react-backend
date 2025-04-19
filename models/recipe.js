const { Schema, model } = require("mongoose");
const Joi = require("joi");

const ingredientSchema = Schema({
  i_name: { type: String, required: true },
  i_weight: { type: String, required: true },
});

const stepSchema = Schema({
  step: { type: Number },
  img: { type: String, default: null },
  text: { type: String, default: "" },
});

const recipeSchema = Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    img: { type: String, default: null },
    favorite: {
      type: Boolean,
      default: false,
    },
    ingredients: { type: [ingredientSchema], required: true },
    steps: {
      type: [stepSchema],
      // default: [
      //   {
      //     step: 1,
      //     img: null,
      //     text: "",
      //   },
      // ],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    }, // Связь с пользователем
  },
  { timestamps: true }
);

const Recipe = model("recipe", recipeSchema);

const ingredientJoiSchema = Joi.object({
  i_name: Joi.string().required(),
  i_weight: Joi.string().required(),
});

const stepJoiSchema = Joi.object({
  step: Joi.number().integer().positive().default(1),
  img: Joi.any().default(null),
  text: Joi.string().min(0).allow("").allow(null),
});

const recipeJoiSchema = Joi.object({
  name: Joi.string().required(),
  category: Joi.string().required(),
  img: Joi.any().default(null),
  ingredients: Joi.array().items(ingredientJoiSchema).min(1).required(),
  steps: Joi.array().items(stepJoiSchema),
});

const favoriteRecipeJoiSchema = Joi.object({
  favorite: Joi.bool().required(),
});

module.exports = {
  Recipe,
  recipeJoiSchema,
  favoriteRecipeJoiSchema,
};

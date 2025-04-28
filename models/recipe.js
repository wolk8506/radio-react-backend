const { Schema, model } = require("mongoose");
const Joi = require("joi");

// Схема ингредиента
const ingredientSchema = new Schema(
  {
    i_name: { type: String, required: true, trim: true }, // Добавлено trim для удаления лишних пробелов
    i_weight: { type: String, required: true },
  },
  { _id: false } // Отключаем отдельный _id для вложенных документов
);

// Схема шага рецепта
const stepSchema = new Schema(
  {
    step: { type: Number, required: true, min: 1 }, // Указан min, чтобы шаг всегда был положительным
    img: { type: String, default: null, trim: true }, // trim на случай ссылок на изображение
    text: { type: String, default: "", trim: true }, // trim для текста
  },
  { _id: false }
);

// Схема рецепта
const recipeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    img: { type: String, default: null, trim: true },
    favorite: { type: Boolean, default: false },
    ingredients: { type: [ingredientSchema], required: true },
    steps: { type: [stepSchema] },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    }, // Связь с пользователем
  },
  { timestamps: true } // Автоматическое добавление полей createdAt и updatedAt
);

const Recipe = model("recipe", recipeSchema);

// Схема ингредиента
const ingredientJoiSchema = Joi.object({
  i_name: Joi.string().required().messages({
    "any.required": "Название ингредиента обязательно.",
    "string.base": "Название ингредиента должно быть строкой.",
  }),
  i_weight: Joi.string().required().messages({
    "any.required": "Вес ингредиента обязателен.",
    "string.base": "Вес ингредиента должен быть строкой.",
  }),
});

// Схема шага рецепта
const stepJoiSchema = Joi.object({
  step: Joi.number().integer().positive().default(1).messages({
    "number.base": "Шаг должен быть числом.",
    "number.integer": "Шаг должен быть целым числом.",
    "number.positive": "Шаг должен быть положительным числом.",
  }),
  img: Joi.any().default(null).messages({
    "any.default": "Изображение по умолчанию задано как null.",
  }),
  text: Joi.string().min(0).allow("").allow(null).messages({
    "string.base": "Текст должен быть строкой.",
  }),
});

// Схема рецепта
const recipeJoiSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Название рецепта обязательно.",
    "string.base": "Название рецепта должно быть строкой.",
  }),
  category: Joi.string().required().messages({
    "any.required": "Категория рецепта обязательна.",
    "string.base": "Категория рецепта должна быть строкой.",
  }),
  img: Joi.any().default(null).messages({
    "any.default": "Изображение по умолчанию задано как null.",
  }),
  ingredients: Joi.array()
    .items(ingredientJoiSchema)
    .min(1)
    .required()
    .messages({
      "array.base": "Ингредиенты должны быть в виде массива.",
      "array.min": "Рецепт должен содержать как минимум один ингредиент.",
      "any.required": "Ингредиенты обязательны.",
    }),
  steps: Joi.array().items(stepJoiSchema).messages({
    "array.base": "Шаги должны быть в виде массива.",
  }),
});

// Схема добавления в избранное
const favoriteRecipeJoiSchema = Joi.object({
  favorite: Joi.bool().required().messages({
    "any.required": "Поле избранного обязательно.",
    "boolean.base": "Поле избранного должно быть булевым значением.",
  }),
});

module.exports = {
  Recipe,
  recipeJoiSchema,
  favoriteRecipeJoiSchema,
};

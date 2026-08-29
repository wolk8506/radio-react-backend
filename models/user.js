const { Schema, model } = require("mongoose");
const Joi = require("joi");
const bcrypt = require("bcryptjs");

const userSchema = new Schema(
  {
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6, // Добавляем минимальную длину пароля
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true, // Приведение email к нижнему регистру для консистентности
      match: [
        /^\S+@\S+\.\S+$/,
        "Please provide a valid email address", // Проверка формата email
      ],
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // разрешаем несколько null, но уникальность для заданных значений
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true, // Убирает лишние пробелы
    },
    subscription: {
      type: String,
      enum: ["starter", "pro", "business"],
      default: "starter",
    },
    token: {
      type: String,
      default: null,
    },
    avatarURL: {
      type: String,
      required: true,
      trim: true, // Убирает пробелы из ссылок
    },
    walpaperURL: {
      type: String,
      default: null,
      trim: true, // Убирает пробелы из ссылок
    },
    verify: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      required: [true, "Verify token is required"],
    },
    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: "Recipe", // Ссылка на коллекцию рецептов
      },
    ],
    cities: [
      {
        city: {
          type: String,
          required: true,
        },
        home: {
          type: Boolean,
          default: false,
        },
        favorite: {
          type: Boolean,
          default: true,
        },
        lat: {
          type: Number,
          default: null,
        },
        lon: {
          type: Number,
          default: null,
        },
      },
    ],
  },
  {
    versionKey: false, // Отключение поля `__v`
    timestamps: true, // Автоматическое добавление полей `createdAt` и `updatedAt`
  }
);

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

const SUBSCRIPTION_VALUES = ["starter", "pro", "business"];

userSchema.pre("validate", function (next) {
  if (!SUBSCRIPTION_VALUES.includes(this.subscription)) {
    this.subscription = "starter";
  }
  next();
});

const User = model("user", userSchema);

// Схема регистрации
const joiRegisterSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Укажите корректный email.",
    "any.required": "Email обязателен для заполнения.",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Пароль должен быть не менее 6 символов.",
    "any.required": "Пароль обязателен для заполнения.",
  }),
  name: Joi.string().min(2).required().messages({
    "string.min": "Имя должно быть не короче 2 символов.",
    "any.required": "Имя обязательно для заполнения.",
  }),
});

// Схема логина
const joiLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Укажите корректный email.",
    "any.required": "Email обязателен для заполнения.",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Пароль должен быть не менее 6 символов.",
    "any.required": "Пароль обязателен для заполнения.",
  }),
});

// Схема подписки
const joiSubscriptionSchema = Joi.object({
  subscription: Joi.string()
    .valid("starter", "pro", "business")
    .required()
    .messages({
      "any.only": "Подписка должна быть одной из: starter, pro, business.",
      "any.required": "Подписка обязательна для заполнения.",
    }),
});

// Схема повторной верификации email
const joiResendVerifyEmailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Укажите корректный email.",
    "any.required": "Email обязателен для заполнения.",
  }),
});

// Схема обновления email
const joiUpdateEmailSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Укажите корректный email.",
    "any.required": "Email обязателен для заполнения.",
  }),
});

// Схема обновления имени
const joiUpdateNameSchema = Joi.object({
  name: Joi.string().min(2).required().messages({
    "string.min": "Имя должно быть не короче 2 символов.",
    "any.required": "Имя обязательно для заполнения.",
  }),
});

// Схема добавления города в избранное пользователя
const joiCitySchema = Joi.object({
  city: Joi.string().required().messages({
    "any.required": "Название города обязательно.",
  }),
  home: Joi.boolean().default(false),
  favorite: Joi.boolean().default(true),
  lat: Joi.number(),
  lon: Joi.number(),
});

// Схема изменения пароля
const joiChangePasswordSchema = Joi.object({
  userId: Joi.string().required().messages({
    "any.required": "Идентификатор пользователя обязателен.",
    "string.base": "Идентификатор пользователя должен быть строкой.",
  }),
  oldPassword: Joi.string().min(6).required().messages({
    "any.required": "Старый пароль обязателен.",
    "string.min": "Старый пароль должен содержать минимум 6 символов.",
  }),
  newPassword: Joi.string().min(6).required().messages({
    "any.required": "Новый пароль обязателен.",
    "string.min": "Новый пароль должен содержать минимум 6 символов.",
  }),
});

module.exports = {
  User,
  joiRegisterSchema,
  joiLoginSchema,
  joiSubscriptionSchema,
  joiResendVerifyEmailSchema,
  joiUpdateNameSchema,
  joiUpdateEmailSchema,
  joiChangePasswordSchema,
  joiCitySchema,
};

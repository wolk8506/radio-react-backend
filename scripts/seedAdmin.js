// Скрипт создания/обновления проверенного пользователя (admin) для локальной разработки.
// Запуск: node scripts/seedAdmin.js
//   опционально через переменные окружения:
//     SEED_EMAIL, SEED_PASSWORD, SEED_NAME
// Требует подключения к БД (DB_HOST из .env).

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const gravatar = require("gravatar");
const shortid = require("shortid");
const { User } = require("../models/user");

const email = process.env.SEED_EMAIL || "admin@local.dev";
const password = process.env.SEED_PASSWORD || "admin123";
const name = process.env.SEED_NAME || "admin";

async function seed() {
  const { DB_HOST } = process.env;
  if (!DB_HOST) {
    throw new Error("DB_HOST не задан в .env");
  }

  await mongoose.connect(DB_HOST);
  console.log("Database connection successful");

  const hashPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  const avatarURL = gravatar.url(email);

  const existing = await User.findOne({ email });

  if (existing) {
    existing.password = hashPassword;
    existing.verify = true;
    existing.isAdmin = true;
    existing.verificationToken = shortid();
    existing.avatarURL = avatarURL;
    await existing.save();
    console.log(`Пользователь ${email} обновлён, подтверждён и назначен админом (verify: true, isAdmin: true)`);
  } else {
    await User.create({
      name,
      email,
      password: hashPassword,
      verify: true,
      isAdmin: true,
      verificationToken: shortid(),
      avatarURL,
    });
    console.log(`Создан подтверждённый админ: ${email} / ${password}`);
  }
}

seed()
  .then(() => {
    console.log("Seed завершён");
    process.exit(0);
  })
  .catch(err => {
    console.error("Ошибка seed:", err.message);
    process.exit(1);
  });

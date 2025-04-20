// const express = require("express");
const { Dropbox } = require("dropbox");
const fetch = require("isomorphic-fetch"); // Import a fetch-compatible library for making HTTP requests
const dbx = new Dropbox({
  accessToken: process.env.ACCESS_TOKEN,
  fetch,
});

// const router = express.Router();
// const ACCESS_TOKEN = "ВАШ_ТОКЕН"; // Замените на свой

// const dbx = new Dropbox({ accessToken: ACCESS_TOKEN });

const upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Файл не найден" });
    }

    const dropboxPath = `/${req.file.originalname}`;
    const fileBuffer = req.file.buffer;

    const response = await dbx.filesUpload({
      path: dropboxPath,
      contents: fileBuffer,
      mode: "add",
    });

    res.json({ message: "Файл загружен!", path: response.result.path_display });
  } catch (error) {
    console.error("Ошибка загрузки:", error);
    res.status(500).json({ message: "Ошибка при загрузке файла" });
  }
};

module.exports = upload;

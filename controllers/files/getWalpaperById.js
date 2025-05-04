require("dotenv").config();
const { Dropbox } = require("dropbox"); // Import the Dropbox SDK
const fetch = require("isomorphic-fetch"); // Import a fetch-compatible library for making HTTP requests

const getWalpaperById = async (req, res) => {
  const dbx = new Dropbox({
    accessToken: process.env.ACCESS_TOKEN,
    fetch,
  });

  const { fileId } = req.params;

  try {
    const response = await dbx.filesDownload({
      path: `/walpaper/${fileId}`,
    });

    // # Получаем бинарные данные файла
    const fileData = response.result.fileBinary;

    // Устанавливаем корректный заголовок MIME-тип (зависит от типа файла)
    res.setHeader("Content-Type", "image/jpeg"); // Если у тебя PNG, замени на "image/png"

    // Отправляем данные файла
    res.send(fileData);
  } catch (error) {
    console.error("Ошибка при загрузке:", error);
    res.status(500).json({ message: "Ошибка при обработке файла" });
  }
};

module.exports = getWalpaperById;

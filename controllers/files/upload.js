require("dotenv").config();
const { Dropbox } = require("dropbox");
const fetch = require("isomorphic-fetch"); // Используем совместимую библиотеку для HTTP-запросов

const upload = async (req, res) => {
  const dbx = new Dropbox({
    accessToken: process.env.ACCESS_TOKEN,
    fetch,
  });

  try {
    // Проверяем, есть ли загруженные файлы
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Файлы не найдены" });
    }

    // Итерация по массиву файлов
    const uploadedFiles = [];
    for (const file of req.files) {
      const dropboxPath = `/recipe/${file.originalname}`;
      const fileBuffer = file.buffer;

      // Загружаем файл в Dropbox
      const response = await dbx.filesUpload({
        path: dropboxPath,
        contents: fileBuffer,
        mode: "add",
      });

      // Добавляем успешный результат в массив
      uploadedFiles.push({
        name: file.originalname,
        path: response.result.path_display,
      });
    }

    res.json({
      message: "Файлы успешно загружены!",
      uploadedFiles,
    });
  } catch (error) {
    console.error("Ошибка загрузки файлов:", error);
    res.status(500).json({ message: "Ошибка при загрузке файлов" });
  }
};

module.exports = upload;

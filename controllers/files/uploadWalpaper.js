require("dotenv").config();
const { Dropbox } = require("dropbox");
const fetch = require("isomorphic-fetch"); // Используем совместимую библиотеку для HTTP-запросов

const uploadWalpaper = async (req, res) => {
  const dbx = new Dropbox({
    accessToken: process.env.ACCESS_TOKEN,
    fetch,
  });

  try {
    // Проверяем, есть ли загруженный файл
    if (!req.file) {
      return res.status(400).json({ message: "Файл не найден" });
    }

    const dropboxPath = `/walpaper/${req.file.originalname}`;
    const fileBuffer = req.file.buffer;

    // Загружаем файл в Dropbox
    const response = await dbx.filesUpload({
      path: dropboxPath,
      contents: fileBuffer,
      mode: "add",
    });

    res.json({
      message: "Файл успешно загружен!",
      file: {
        name: req.file.originalname,
        path: response.result.path_display,
      },
    });
  } catch (error) {
    console.error("Ошибка загрузки файла:", error);
    res.status(500).json({ message: "Ошибка при загрузке файла" });
  }
};

module.exports = uploadWalpaper;

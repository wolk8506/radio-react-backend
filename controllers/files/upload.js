require("dotenv").config();
const { Dropbox } = require("dropbox");
const fetch = require("isomorphic-fetch"); // Import a fetch-compatible library for making HTTP requests

const upload = async (req, res) => {
  const dbx = new Dropbox({
    accessToken: process.env.ACCESS_TOKEN,
    fetch,
  });
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

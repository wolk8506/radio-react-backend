require("dotenv").config();
const { Dropbox } = require("dropbox");
const fetch = require("isomorphic-fetch"); // Библиотека для HTTP-запросов

const deleteFiles = async (req, res) => {
  const dbx = new Dropbox({
    accessToken: process.env.ACCESS_TOKEN,
    fetch,
  });

  try {
    // Проверяем, есть ли указанные пути файлов для удаления
    const { filePaths } = req.body;
    if (!filePaths || filePaths.length === 0) {
      return res
        .status(400)
        .json({ message: "Не указаны пути к файлам для удаления" });
    }

    // Итерация по массиву файлов и удаление каждого
    const deletedFiles = [];
    for (const path of filePaths) {
      const response = await dbx.filesDeleteV2({ path });
      deletedFiles.push({
        path: response.result.metadata.path_display,
        name: response.result.metadata.name,
      });
    }

    res.json({
      message: "Файлы успешно удалены!",
      deletedFiles,
    });
  } catch (error) {
    console.error("Ошибка удаления файлов:", error);
    res.status(500).json({ message: "Ошибка при удалении файлов" });
  }
};

module.exports = deleteFiles;

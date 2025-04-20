const { User } = require("../../models");
const fs = require("fs/promises");
const Jimp = require("jimp");
const { Dropbox } = require("dropbox");
const crypto = require("crypto"); // Для генерации случайного имени

require("dotenv").config();

const dbx = new Dropbox({ accessToken: process.env.ACCESS_TOKEN });

const updateAvatar = async (req, res) => {
  const { path: tempUpload, originalname } = req.file;

  // Генерируем случайное имя файла
  const randomName = crypto.randomBytes(12).toString("hex");
  const extension = originalname.split(".").pop();
  const newFileName = `${randomName}.${extension}`;
  const dropboxPath = `/avatars/${newFileName}`;

  try {
    const avatar = await Jimp.read(tempUpload);
    await avatar.resize(250, 250).writeAsync(tempUpload);

    // Читаем файл и загружаем в Dropbox
    const fileBuffer = await fs.readFile(tempUpload);

    if (fileBuffer.length > 0) {
      await dbx.filesUpload({
        path: dropboxPath,
        contents: fileBuffer,
        mode: "overwrite",
      });
    } else {
      console.error("Ошибка: Пустой файл, загрузка отменена!");
    }

    await dbx.filesUpload({
      path: dropboxPath,
      contents: fileBuffer,
      mode: "overwrite",
    });

    await User.findByIdAndUpdate(req.user._id, {
      avatarURL: `/files${dropboxPath}`,
    });

    res.json({ avatarURL: `/files${dropboxPath}` }); // Возвращаем путь вместо прямой ссылки
  } catch (error) {
    await fs.unlink(tempUpload);
    console.error("Ошибка загрузки:", error);
    res.status(500).json({ message: "Ошибка при загрузке аватара" });
  }
};

module.exports = updateAvatar;

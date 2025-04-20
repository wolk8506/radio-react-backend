const multer = require("multer");

const storage = multer.memoryStorage(); // Храним файл в памяти перед загрузкой
const upload = multer({ storage });

module.exports = upload;

const axios = require("axios");
require("dotenv").config();

const refreshAccessToken = async () => {
  try {
    const response = await axios.post(
      "https://api.dropbox.com/oauth2/token",
      null,
      {
        params: {
          grant_type: "refresh_token",
          refresh_token: process.env.REFRESH_TOKEN,
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
        },
      }
    );

    const newToken = response.data.access_token;
    process.env.ACCESS_TOKEN = newToken; // ✅ Обновляем глобально
    console.log("Обновленный токен:", newToken);

    return newToken;
  } catch (error) {
    console.error("Ошибка обновления токена:", error.response?.data || error);
  }
};

const ensureValidToken = async (req, res, next) => {
  if (!process.env.ACCESS_TOKEN) {
    console.log("Токен истек, обновляем...");
    await refreshAccessToken();
  }
  req.accessToken = process.env.ACCESS_TOKEN; // ✅ Используем обновленный токен
  next();
};

module.exports = { ensureValidToken, refreshAccessToken };

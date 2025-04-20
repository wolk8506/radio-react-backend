const axios = require("axios");
require("dotenv").config();

let ACCESS_TOKEN = process.env.ACCESS_TOKEN;

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

    ACCESS_TOKEN = response.data.access_token;
    console.log("Обновленный токен:", ACCESS_TOKEN);

    return ACCESS_TOKEN;
  } catch (error) {
    console.error("Ошибка обновления токена:", error.response?.data || error);
  }
};

const ensureValidToken = async (req, res, next) => {
  if (!ACCESS_TOKEN) {
    console.log("Токен истек, обновляем...");
    await refreshAccessToken();
  }
  req.accessToken = ACCESS_TOKEN; // Передаем токен в запрос
  next();
};

module.exports = { ensureValidToken, refreshAccessToken };

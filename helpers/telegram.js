const axios = require("axios");
const cheerio = require("cheerio");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36";

// Извлекает имя канала из ссылки вида https://t.me/chan или https://t.me/s/chan
function channelFromUrl(urlOrChannel) {
  const s = String(urlOrChannel || "");
  const m = s.match(/t\.me\/(?:s\/)?([\w_]+)/i);
  if (m) return m[1];
  return s.replace(/[^\\w_]/g, "");
}

// Забирает посты публичного Telegram-канала через t.me/s/<channel> (HTML).
// Возвращает нормализованные объекты, совместимые с fetchFeed().
async function fetchTelegram(urlOrChannel) {
  const channel = channelFromUrl(urlOrChannel);
  const url = `https://t.me/s/${channel}`;
  const { data } = await axios.get(url, {
    headers: { "User-Agent": UA, Accept: "text/html", "Accept-Language": "ru-RU,ru;q=0.9" },
    timeout: 20000,
  });
  // t.me/s иногда отдаёт HTML с некорректными сущностями (например, "&" не в составе
  // валидной entity) — это ломает HTML-парсер. Нормализуем разрозненные "&" в "&amp;".
  const safe = String(data).replace(
    /&(?!(?:[a-zA-Z][a-zA-Z0-9]*|#[0-9]+|#x[0-9a-fA-F]+);)/g,
    "&amp;"
  );
  const $ = cheerio.load(safe);
  const items = [];
  $(".tgme_widget_message").each((_, el) => {
    const $el = $(el);
    const dateLink = $el.find("a.tgme_widget_message_date").attr("href") || "";
    const text = $el.find(".tgme_widget_message_text").text().trim();
    if (!text) return;
    const timeStr = $el.find("time").attr("datetime");
    const publishedAt = timeStr ? new Date(timeStr) : new Date();
    const link = dateLink || `https://t.me/${channel}`;
    items.push({
      link,
      guid: link,
      title: text.slice(0, 140),
      content: text,
      author: channel,
      publishedAt,
    });
  });
  return items;
}

module.exports = { fetchTelegram, channelFromUrl };

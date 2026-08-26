const axios = require("axios");

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

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function stripHtml(s) {
  return decodeEntities(String(s).replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
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
  const html = String(data);
  const items = [];
  // Делим страницу на блоки сообщений по открывающему тегу <div class="tgme_widget_message ...">
  const blocks = html.split(/<div class="tgme_widget_message[ "]/);
  for (const block of blocks.slice(1)) {
    const hrefMatch = block.match(/tgme_widget_message_date" href="([^"]+)"/);
    const dtMatch = block.match(/datetime="([^"]+)"/);
    const textMatch = block.match(/tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/);
    if (!hrefMatch || !textMatch) continue;
    const text = stripHtml(textMatch[1]);
    if (!text) continue;
    const link = hrefMatch[1];
    const publishedAt = dtMatch ? new Date(dtMatch[1]) : new Date();
    items.push({
      link,
      guid: link,
      title: text.slice(0, 140),
      content: text,
      author: channel,
      publishedAt,
    });
  }
  return items;
}

module.exports = { fetchTelegram, channelFromUrl };

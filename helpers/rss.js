const RssParser = require("rss-parser");

const parser = new RssParser({
  timeout: 15000,
  headers: { "User-Agent": "Mozilla/5.0 (radio-react-news-fetcher)" },
});

// Забирает items из RSS-ленты. Возвращает нормализованные объекты.
async function fetchFeed(url) {
  const feed = await parser.parseURL(url);
  return (feed.items || []).map((it) => ({
    link: it.link || it.guid,
    guid: it.guid || it.link,
    title: it.title || "",
    content: it.contentSnippet || it.content || it.summary || "",
    author: it.creator || it.author || it["dc:creator"] || "",
    publishedAt: it.isoDate
      ? new Date(it.isoDate)
      : it.pubDate
      ? new Date(it.pubDate)
      : new Date(),
  }));
}

module.exports = { fetchFeed };

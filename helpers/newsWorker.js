const cron = require("node-cron");
const { NewsSource, NewsItem } = require("../models/newsModels");
const { fetchFeed } = require("./rss");
const { fetchTelegram } = require("./telegram");
const { summarizeNews, summarizeBatch, quotaOk, sleep, hasLLM, provider } = require("./gemini");

// Базовый набор лент (создаётся при первом запуске, если источников нет).
const DEFAULT_SOURCES = [
  { title: "Хабр", url: "https://habr.com/ru/rss/all/all/", category: "it" },
  { title: "VC.ru", url: "https://vc.ru/rss", category: "бизнес" },
  { title: "TJournal", url: "https://tjournal.ru/rss", category: "общество" },
  { title: "РИА Новости", url: "https://ria.ru/services/rss/", category: "общество" },
  { title: "Лента.ру", url: "https://lenta.ru/rss", category: "общество" },
  { title: "Медуза", url: "https://meduza.io/rss/all", category: "общество" },
  { title: "3DNews", url: "https://3dnews.ru/news/rss/", category: "it" },
  { title: "РБК", url: "https://rbc.ru/rss/main.rss", category: "финансы" },
];

const INTERVAL_MIN = Number(process.env.NEWS_FETCH_INTERVAL_MIN) || 15;
const LLM_DELAY_MS = Number(process.env.NEWS_LLM_DELAY_MS) || 4500;
const MAX_NEW_PER_SOURCE = Number(process.env.NEWS_MAX_NEW_PER_SOURCE) || 40;
const GEMINI_BATCH = Number(process.env.NEWS_GEMINI_BATCH) || 8;
// Глубина хранения новостей (дней). 0 — без ограничений. Защищает БД (напр. Mongo 500MB).
const RETENTION_DAYS = Number(process.env.NEWS_RETENTION_DAYS) || 7;

let isRunning = false;

async function ensureDefaultSources() {
  const count = await NewsSource.countDocuments();
  if (count === 0) {
    await NewsSource.insertMany(DEFAULT_SOURCES);
    console.log(`[news] seeded ${DEFAULT_SOURCES.length} default RSS sources`);
  }
}

async function processSource(source) {
  let items;
  try {
    // t.me-ссылки всегда идут через Telegram-фетчер, даже если тип в БД остался rss.
    const useTelegram = source.type === "telegram" || /t\.me\//i.test(source.url || "");
    items = useTelegram
      ? await fetchTelegram(source.url)
      : await fetchFeed(source.url);
  } catch (e) {
    source.lastError = e.message;
    source.lastFetched = new Date();
    await source.save();
    console.error(`[news] fetch failed (${source.title}):`, e.message);
    return;
  }

  // Собираем только новые (ещё не сохранённые) item, чтобы не тратить квоту на дубли.
  const pending = [];
  for (const item of items) {
    if (pending.length >= MAX_NEW_PER_SOURCE) break;
    if (!item.link || !item.title) continue;
    const exists = await NewsItem.findOne({ link: item.link });
    if (exists) continue;
    pending.push(item);
  }

  let added = 0;
  // Пакетная суммаризация: по GEMINI_BATCH item на один вызов LLM (экономия квоты).
  for (let i = 0; i < pending.length; i += GEMINI_BATCH) {
    const chunk = pending.slice(i, i + GEMINI_BATCH);
    let results = null;
    if (quotaOk()) {
      try {
        results = await summarizeBatch(chunk.map((it) => ({ title: it.title, content: it.content })));
      } catch (e) {
        console.warn(`[news] LLM batch failed (${source.title}): ${e.message}`);
      }
    } else if (hasLLM) {
      console.warn(`[news] LLM daily quota reached — остальные item без суммаризации (fallback)`);
    }

    // Если батч пуст/не удался — откатываемся на поштучные вызовы (гарантируем теги).
    if (quotaOk() && (!Array.isArray(results) || results.length === 0)) {
      results = [];
      for (const it of chunk) {
        if (!quotaOk()) {
          results.push(null);
          continue;
        }
        try {
          results.push(await summarizeNews(it.title, it.content));
        } catch (e) {
          results.push(null);
        }
        await sleep(LLM_DELAY_MS);
      }
    }

    const usedGemini = Array.isArray(results) && results.length > 0;
    for (let j = 0; j < chunk.length; j++) {
      const item = chunk[j];
      let summary;
      let category = "general";
      let tags = [];
      const r = results ? results[j] : null;
      if (r && (r.summary || (r.tags && r.tags.length))) {
        summary = r.summary;
        category = r.category || "general";
        tags = r.tags || [];
      }
      if (!summary) {
        summary = (item.content || item.title || "").slice(0, 400).trim();
      }
      await NewsItem.create({
        source: source._id,
        link: item.link,
        guid: item.guid,
        title: item.title,
        content: (item.content || "").slice(0, 8000),
        summary,
        category,
        tags,
        author: item.author,
        publishedAt: item.publishedAt,
        processed: true,
      });
      added += 1;
    }
    if (usedGemini) await sleep(LLM_DELAY_MS);
  }

  source.lastFetched = new Date();
  source.lastError = added ? "" : source.lastError;
  await source.save();
  console.log(`[news] ${source.title}: added ${added} new items`);
}

// Удаляет новости старше RETENTION_DAYS, чтобы не раздувать БД.
async function cleanupOldItems() {
  if (RETENTION_DAYS <= 0) return;
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400 * 1000);
  try {
    const res = await NewsItem.deleteMany({
      $or: [{ publishedAt: { $lt: cutoff } }, { publishedAt: { $exists: false } }],
    });
    if (res.deletedCount) {
      console.log(`[news] cleaned ${res.deletedCount} items older than ${RETENTION_DAYS}d`);
    }
  } catch (e) {
    console.error("[news] cleanup failed:", e.message);
  }
}

async function runOnce() {
  if (isRunning) return;
  isRunning = true;
  try {
    await ensureDefaultSources();
    const sources = await NewsSource.find({ active: true });
    for (const source of sources) {
      await processSource(source);
    }
    await cleanupOldItems();
  } catch (e) {
    console.error("[news] worker error:", e.message);
  } finally {
    isRunning = false;
  }
}

function startNewsWorker() {
  console.log(
    `[news] worker started (interval ${INTERVAL_MIN} min, LLM: ${provider} ${hasLLM ? "on" : "OFF(fallback)"}, delay ${LLM_DELAY_MS}ms)`
  );
  // первый прогон чуть погодя, чтобы сервер успел подняться
  setTimeout(runOnce, 5000);
  cron.schedule(`*/${INTERVAL_MIN} * * * *`, runOnce);
}

module.exports = startNewsWorker;

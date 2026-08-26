const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Провайдер: Groq (бесплатный, высокие лимиты) > Gemini > нет.
let client = null;
if (GEMINI_API_KEY) client = new GoogleGenerativeAI(GEMINI_API_KEY);
const provider = GROQ_API_KEY ? "groq" : GEMINI_API_KEY ? "gemini" : "none";

const CATEGORIES = [
  "технологии", "it", "наука", "бизнес", "финансы", "экономика",
  "политика", "общество", "спорт", "развлечения", "кино", "игры",
  "авто", "недвижимость", "здоровье", "путешествия", "образование", "энергетика",
];

//  ~ Дневной лимит вызовов  ----------------------------------------------------------------
// Gemini free-тариф — ~20 запросов/день на модель (жёстко). Groq — гораздо щедрее (RPM-лимит),
// поэтому ставим высокий потолок, чтобы не уйти в бесконечный расход при ошибках.
const DAILY_CAP = Number(process.env.NEWS_MAX_LLM_PER_DAY) || (provider === "gemini" ? 18 : 400);
let dayKey = new Date().toISOString().slice(0, 10);
let dayCount = 0;

function quotaOk() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== dayKey) {
    dayKey = today;
    dayCount = 0;
  }
  return provider !== "none" && dayCount < DAILY_CAP;
}

function countCall() {
  dayCount += 1;
}

const SINGLE_SYS =
  "Ты — редактор новостной ленты. Верни ТОЛЬКО JSON без markdown-форматирования. " +
  "Объект должен содержать поля:\n" +
  "- summary: краткая выжимка на русском языке, 2-4 предложения, не более 600 символов. " +
  "Если исходный текст на украинском или другом языке — переведи выжимку на русский.\n" +
  `- category: одна из категорий: ${CATEGORIES.join(", ")}. Если не подходит — "общество".\n` +
  "- tags: массив из 2-5 ключевых слов/тегов на русском (нижний регистр, без #), отражающих тему.";

const BATCH_SYS =
  "Ты — редактор новостной ленты. На входе JSON-массив новостей с полями i, title, content. " +
  "Верни ТОЛЬКО JSON-объект вида { \"results\": [ ... ] }, где каждый элемент " +
  "{ i, summary, category, tags }. " +
  "summary — краткая выжимка на русском (2-4 предложения, не более 600 символов; " +
  "если исходник на украинском или другом языке — переведи на русский). " +
  `- category — одна из: ${CATEGORIES.join(", ")} или "общество". ` +
  "tags — массив из 2-5 ключевых слов/тегов на русском (нижний регистр, без #). " +
  "Строго JSON без markdown-форматирования.";

function normalizeOne(d) {
  let rawTags = d.tags;
  if (typeof rawTags === "string") {
    rawTags = rawTags.split(/[;,]/).flatMap((part) => part.split(/\s+/));
  }
  return {
    summary: String(d.summary || "").slice(0, 600),
    category: String(d.category || "general").toLowerCase().slice(0, 40),
    tags: Array.isArray(rawTags)
      ? rawTags.map((t) => String(t).toLowerCase().replace(/^#/, "").trim()).filter(Boolean).slice(0, 8)
      : [],
  };
}

// Универсальный вызов выбранного провайдера. Возвращает сырой текст ответа.
async function llmComplete(system, user) {
  if (provider === "groq") {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.3,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        timeout: 30000,
      }
    );
    return res.data.choices[0].message.content;
  }
  const genModel = client.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: "application/json" },
  });
  const result = await genModel.generateContent(`${system}\n\n${user}`);
  return result.response.text();
}

function stripCodeFence(raw) {
  return raw.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
}

// Извлекает JSON из ответа модели даже если он обёрнут в прозу/markdown.
function extractJson(raw) {
  const t = stripCodeFence(raw);
  try {
    return JSON.parse(t);
  } catch (e) {
    const start = t.search(/[[{]/);
    if (start === -1) throw new Error("no JSON in LLM response");
    const end = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
    return JSON.parse(t.slice(start, end + 1));
  }
}

function isRetryable(err) {
  const msg = (err && err.message) || "";
  return /503|429|Service Unavailable|rate limit|timeout|ETIMEDOUT|ECONNRESET|fetch failed/i.test(msg);
}

// Одна новость -> { summary, category, tags }
async function summarizeNews(title, content) {
  if (provider === "none") {
    return { summary: (content || title || "").slice(0, 400).trim(), category: "general", tags: [] };
  }
  const user = `Заголовок: ${title}\nТекст: ${(content || "").slice(0, 4000)}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const raw = await llmComplete(SINGLE_SYS, user);
      countCall();
      return normalizeOne(extractJson(raw));
    } catch (e) {
      if (!isRetryable(e) || attempt === 3) {
        console.error("LLM summarize failed:", e.message);
        return { summary: (content || title || "").slice(0, 400).trim(), category: "general", tags: [] };
      }
      console.warn(`LLM attempt ${attempt} failed (${e.message}); retry in ${1500 * attempt}ms`);
      await sleep(1500 * attempt);
    }
  }
}

// Пакетная суммаризация: один вызов на N новостей (экономит квоту).
async function summarizeBatch(items) {
  if (provider === "none") return [];
  const payload = items.map((it, i) => ({ i, title: it.title, content: (it.content || "").slice(0, 4000) }));
  const raw = await llmComplete(BATCH_SYS, JSON.stringify(payload));
  countCall();
  const parsed = extractJson(raw);
  let arr = Array.isArray(parsed) ? parsed : parsed.results;
  if (!Array.isArray(arr)) {
    arr = Object.values(parsed).find((v) => Array.isArray(v)) || [];
  }
  return Array.isArray(arr) ? arr.map(normalizeOne) : [];
}

module.exports = { summarizeNews, summarizeBatch, quotaOk, sleep, hasLLM: provider !== "none", provider };

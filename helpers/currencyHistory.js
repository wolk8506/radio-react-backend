const axios = require("axios");

const NBU = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange";

// In-memory кеш, чтобы не дёргать NBU на каждый рендер (данные меняются раз в сутки)
const cache = new Map(); // key: `${code}:${days}` -> { data, fetchedAt }

const nbuDate = d => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
};

const fetchOneDay = async (code, dateStr) => {
  try {
    const { data } = await axios.get(`${NBU}?valcode=${code}&date=${dateStr}&json`, {
      timeout: 5000,
    });
    if (Array.isArray(data) && data.length) {
      return { date: data[0].exchangedate, rate: Number(data[0].rate) };
    }
  } catch {
    // пропускаем нерабочие дни / ошибки
  }
  return null;
};

const getSeries = async (code, days) => {
  const today = new Date();
  const tasks = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    tasks.push(fetchOneDay(code, nbuDate(d)));
  }
  const results = await Promise.all(tasks);
  return results.filter(Boolean);
};

const getHistory = async (codes = ["USD", "EUR"], days = 30) => {
  const out = {};
  for (const code of codes) {
    const key = `${code}:${days}`;
    const cached = cache.get(key);
    const now = Date.now();
    if (cached && now - cached.fetchedAt < 6 * 60 * 60 * 1000) {
      out[code] = cached.data;
      continue;
    }
    const series = await getSeries(code, days);
    cache.set(key, { data: series, fetchedAt: now });
    out[code] = series;
  }
  return out;
};

module.exports = { getHistory };

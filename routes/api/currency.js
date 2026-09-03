const express = require("express");
const router = express.Router();
const axios = require("axios");

const { getHistory } = require("../../helpers/currencyHistory");

// кеши
const cachePrivat = { data: null, ts: 0 };
const cacheRates = new Map();
const cacheCrypto = { data: null, ts: 0 };

// Публичный endpoint: история курсов НБУ за N дней
// ?codes=USD,EUR&days=30
router.get("/history", async (req, res) => {
  try {
    const codes = (req.query.codes || "USD,EUR")
      .split(",")
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);
    const days = Math.min(parseInt(req.query.days, 10) || 30, 90);

    const data = await getHistory(codes, days);
    res.json({ status: "success", code: 200, data: { result: data } });
  } catch {
    res.status(502).json({ status: "error", code: 502, message: "currency history unavailable" });
  }
});

// GET /api/currency/privat — курсы ПриватБанка (бесплатно, без ключа)
router.get("/privat", async (req, res) => {
  try {
    if (cachePrivat.data && Date.now() - cachePrivat.ts < 5 * 60 * 1000) {
      return res.json({ status: "success", code: 200, data: { result: cachePrivat.data } });
    }
    const { data } = await axios.get("https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5", { timeout: 7000 });
    cachePrivat.data = data;
    cachePrivat.ts = Date.now();
    res.json({ status: "success", code: 200, data: { result: data } });
  } catch {
    res.status(502).json({ status: "error", code: 502, message: "privat unavailable" });
  }
});

// GET /api/currency/crypto?ids=bitcoin,ethereum&vs=usd,uah
router.get("/crypto", async (req, res) => {
  try {
    const ids = (req.query.ids || "bitcoin,ethereum").trim();
    const vs = (req.query.vs || "usd,uah").trim();
    if (cacheCrypto.data && Date.now() - cacheCrypto.ts < 2 * 60 * 1000 && cacheCrypto.ids === ids && cacheCrypto.vs === vs) {
      return res.json({ status: "success", code: 200, data: { result: cacheCrypto.data } });
    }
    const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=${encodeURIComponent(vs)}`, { timeout: 7000 });
    cacheCrypto.data = data;
    cacheCrypto.ts = Date.now();
    cacheCrypto.ids = ids;
    cacheCrypto.vs = vs;
    res.json({ status: "success", code: 200, data: { result: data } });
  } catch {
    res.status(502).json({ status: "error", code: 502, message: "crypto unavailable" });
  }
});

// GET /api/currency/rates?base=USD — 150+ валют, free via open.er-api.com + frankfurter fallback
router.get("/rates", async (req, res) => {
  try {
    const base = (req.query.base || "USD").toUpperCase();
    const key = `rates:${base}`;
    const cached = cacheRates.get(key);
    if (cached && Date.now() - cached.ts < 60 * 60 * 1000) {
      return res.json({ status: "success", code: 200, data: { result: cached.data } });
    }
    // primary: open.er-api.com (free, no key)
    try {
      const { data } = await axios.get(`https://open.er-api.com/v6/latest/${base}`, { timeout: 7000 });
      if (data && data.rates) {
        const result = { base, rates: data.rates, time: data.time_last_update_utc };
        cacheRates.set(key, { data: result, ts: Date.now() });
        return res.json({ status: "success", code: 200, data: { result } });
      }
    } catch {}
    // fallback: frankfurter.app (ECB, ~30 валют)
    const { data } = await axios.get(`https://api.frankfurter.app/latest?from=${base}`, { timeout: 7000 });
    const result = { base, rates: data.rates, time: data.date };
    cacheRates.set(key, { data: result, ts: Date.now() });
    res.json({ status: "success", code: 200, data: { result } });
  } catch {
    res.status(502).json({ status: "error", code: 502, message: "rates unavailable" });
  }
});

// GET /api/currency/convert?from=USD&to=UAH&amount=100
router.get("/convert", async (req, res) => {
  try {
    const from = (req.query.from || "USD").toUpperCase();
    const to = (req.query.to || "UAH").toUpperCase();
    const amount = parseFloat(req.query.amount) || 1;
    const base = from;
    const key = `rates:${base}`;
    let ratesData = cacheRates.get(key);
    if (!ratesData || Date.now() - ratesData.ts > 60 * 60 * 1000) {
      const { data } = await axios.get(`https://open.er-api.com/v6/latest/${base}`, { timeout: 7000 });
      if (data && data.rates) {
        ratesData = { data: { base, rates: data.rates }, ts: Date.now() };
        cacheRates.set(key, ratesData);
      }
    }
    const rate = ratesData?.data?.rates?.[to];
    if (!rate) return res.status(400).json({ status: "error", code: 400, message: "rate not found" });
    const result = amount * rate;
    res.json({ status: "success", code: 200, data: { result: { from, to, amount, rate, result } } });
  } catch {
    res.status(502).json({ status: "error", code: 502, message: "convert unavailable" });
  }
});

// кеш для banks Mono (429 защита)
const cacheBanksMono = { data: [], ts: 0 };
const cacheBanksPrivat = { data: [], ts: 0 };

// GET /api/currency/banks — агрегат Mono + Privat + NBU (лучший курс, спред), с кешем от 429
router.get("/banks", async (req, res) => {
  try {
    let privat, mono;
    // Privat с кешем 5 мин
    if (cacheBanksPrivat.data.length && Date.now() - cacheBanksPrivat.ts < 5 * 60 * 1000) {
      privat = cacheBanksPrivat.data;
    } else {
      try {
        const r = await axios.get("https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5", { timeout: 6000 });
        privat = Array.isArray(r.data) ? r.data : [];
        cacheBanksPrivat.data = privat;
        cacheBanksPrivat.ts = Date.now();
      } catch (e) {
        privat = cacheBanksPrivat.data.length ? cacheBanksPrivat.data : [];
      }
    }
    // Mono с кешем 90 сек (лимит 60 сек, 429 часто)
    if (cacheBanksMono.data.length && Date.now() - cacheBanksMono.ts < 90 * 1000) {
      mono = cacheBanksMono.data;
    } else {
      try {
        const r = await axios.get("https://api.monobank.ua/bank/currency", { timeout: 6000, headers: { 'User-Agent': 'radio-react/1.0' } });
        const raw = Array.isArray(r.data) ? r.data : [];
        // нормализуем PLN/RUB/BYN где rateBuy отсутствует — используем rateCross
        mono = raw.map(o => {
          if ((o.currencyCodeA === 985 || o.currencyCodeA === 943 || o.currencyCodeA === 933) && !o.rateBuy && o.rateCross) {
            return { ...o, rateBuy: o.rateCross, rateSell: o.rateCross };
          }
          return o;
        });
        cacheBanksMono.data = mono;
        cacheBanksMono.ts = Date.now();
      } catch (e) {
        // 429 или сеть — отдаём кеш если есть, иначе пусто
        if (e.response && e.response.status === 429 && cacheBanksMono.data.length) {
          mono = cacheBanksMono.data;
        } else if (cacheBanksMono.data.length) {
          mono = cacheBanksMono.data;
        } else {
          mono = [];
        }
      }
    }
    // NBU из кеша истории за 1 день (USD/EUR/PLN/GBP/CHF/CAD/JPY)
    let nbu = {};
    try {
      const h = await getHistory(["USD", "EUR", "PLN", "GBP", "CHF", "CAD", "JPY", "TRY", "CNY"], 1);
      Object.entries(h).forEach(([code, arr]) => {
        if (arr[0]) nbu[code] = arr[0].rate;
      });
    } catch {}
    const isStaleMono = Date.now() - cacheBanksMono.ts > 90 * 1000;
    res.json({ status: "success", code: 200, data: { result: { privat, mono, nbu, meta: { monoStale: isStaleMono, monoCachedAt: cacheBanksMono.ts } } } });
  } catch {
    res.status(502).json({ status: "error", code: 502, message: "banks unavailable" });
  }
});

module.exports = router;

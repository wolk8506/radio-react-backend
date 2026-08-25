const express = require("express");
const router = express.Router();

const { getHistory } = require("../../helpers/currencyHistory");

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

module.exports = router;

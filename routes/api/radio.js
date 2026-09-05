const express = require("express");
const router = express.Router();

const radio = require("../../helpers/radioNowPlaying");

// Список станций
router.get("/stations", (req, res) => {
  res.json({ status: "success", code: 200, data: { result: radio.getStationList() } });
});

// Что играет на всех станциях (закешировано на бэкенде)
router.get("/now-playing", (req, res) => {
  res.json({ status: "success", code: 200, data: { result: radio.getNowPlaying() } });
});

// Что играет на конкретной станции
router.get("/now-playing/:id", (req, res) => {
  const found = radio.getNowPlayingById(req.params.id);
  if (!found) {
    return res.status(404).json({ status: "error", code: 404, message: "Station not found" });
  }
  res.json({ status: "success", code: 200, data: { result: found } });
});

// История воспроизведения за последний час
router.get("/history/:id", (req, res) => {
  const found = radio.getHistoryById(req.params.id);
  if (!found) {
    return res.status(404).json({ status: "error", code: 404, message: "Station not found" });
  }
  res.json({ status: "success", code: 200, data: { result: found } });
});

// Детальная информация о треке: альбом, жанр, год, превью
// GET /api/radio/track-info?artist=...&track=...
router.get("/track-info", async (req, res) => {
  const { artist = "", track = "" } = req.query;
  if (!artist.trim() && !track.trim()) {
    return res.status(400).json({ status: "error", code: 400, message: "artist or track required" });
  }
  try {
    const info = await radio.getTrackInfo(artist, track);
    if (!info) {
      return res.status(404).json({ status: "error", code: 404, message: "Track not found" });
    }
    res.json({ status: "success", code: 200, data: { result: info } });
  } catch {
    res.status(502).json({ status: "error", code: 502, message: "track info unavailable" });
  }
});

module.exports = router;

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

module.exports = router;

const mongoose = require("mongoose");

const app = require("../app");
const seedLibrary = require("../helpers/seedLibrary");
const startNewsWorker = require("../helpers/newsWorker");

const { DB_HOST, PORT = 8080 } = process.env;

const server = app.listen(PORT, () => {
  console.log(`Server running. Use our API on port: ${PORT}`);
});
server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} already in use — server already running, skipping second instance`);
  } else {
    console.error(err);
    process.exit(1);
  }
});

// DB в фоне, не блокирует старт (виснет на ESERVFAIL DNS)
mongoose
  .connect(DB_HOST, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log("Database connection successful"))
  .then(() => seedLibrary().catch(()=>{}))
  .then(() => { try { startNewsWorker(); } catch {} })
  .catch(err => {
    console.log("DB connection failed, continuing without DB:", err.message);
  });

const express = require("express");
const logger = require("morgan");
const cors = require("cors");
require("dotenv").config();

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const authRouter = require("./routes/api/auth");
const usersRouter = require("./routes/api/users");
const recipeRouter = require("./routes/api/recipes");
const filesRouter = require("./routes/api/files");
const radioRouter = require("./routes/api/radio");
const filmLibraryRouter = require("./routes/api/filmLibrary");
const eventsRouter = require("./routes/api/events");
const currencyRouter = require("./routes/api/currency");

const app = express();

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

// const { refreshAccessToken } = require("./middlewares");
const { refreshAccessToken } = require("./middlewares/refreshTokenDropBox");

setInterval(async () => {
  await refreshAccessToken();
}, 3600000); // Обновление раз в час

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send(
    "<div style='background: #273b39;width: 100%;height: 100%;display: flex;align-items: center;justify-content: center;color: tomato;'}><h2>It's Working!</h2></div>"
  );
});
app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/auth", authRouter);
app.use("/api/user", usersRouter);
app.use("/api/recipe", recipeRouter);
app.use("/api/files", filesRouter);
app.use("/api/radio", radioRouter);
app.use("/api/filmLibrary", filmLibraryRouter);
app.use("/api/events", eventsRouter);
app.use("/api/currency", currencyRouter);
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  const { status = 500 } = err;
  res.status(status).json({ message: err.message });
});

// Централизованный опрос «что играет» для радиостанций (в памяти, без нагрузки на БД)
require("./helpers/radioNowPlaying").startRadioPolling();

module.exports = app;

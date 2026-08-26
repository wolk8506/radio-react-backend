const mongoose = require("mongoose");

const app = require("../app");
const seedLibrary = require("../helpers/seedLibrary");
const startNewsWorker = require("../helpers/newsWorker");

const { DB_HOST, PORT = 8080 } = process.env;

mongoose
  .connect(DB_HOST)
  .then(() => console.log("Database connection successful"))
  .then(() => seedLibrary())
  .then(() => {
    startNewsWorker();
    app.listen(PORT, () => {
      console.log(`Server running. Use our API on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error.message);
    process.exit(1);
  });

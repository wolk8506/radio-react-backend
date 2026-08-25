const getCollections = require("./getCollections");
const createCollection = require("./createCollection");
const getCollectionById = require("./getCollectionById");
const renameCollection = require("./renameCollection");
const deleteCollection = require("./deleteCollection");
const addMovie = require("./addMovie");
const removeMovie = require("./removeMovie");
const reorderMovies = require("./reorderMovies");
const setWatched = require("./setWatched");
const setVisibility = require("./setVisibility");

module.exports = {
  getCollections,
  createCollection,
  getCollectionById,
  renameCollection,
  deleteCollection,
  addMovie,
  removeMovie,
  reorderMovies,
  setWatched,
  setVisibility,
};

const { FilmLibrary } = require("../../models");
const { serializeCollection } = require("./serialize");

// Свои коллекции + все общие
const getCollections = async (req, res) => {
  const { _id } = req.user;
  const collections = await FilmLibrary.find({
    $or: [{ owner: _id }, { isPublic: true }],
  });
  res.json({
    status: "success",
    code: 200,
    data: { result: collections.map(serializeCollection) },
  });
};

module.exports = getCollections;

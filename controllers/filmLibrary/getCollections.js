const { FilmLibrary } = require("../../models");
const { serializeCollection } = require("./serialize");

const getCollections = async (req, res) => {
  const userId = req.user._id;

  const collections = await FilmLibrary.find({
    $or: [{ owner: userId }, { isPublic: true }],
  }).sort({ createdAt: 1 });

  res.json({
    status: "success",
    code: 200,
    data: { result: collections.map(serializeCollection) },
  });
};

module.exports = getCollections;

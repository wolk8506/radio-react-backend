const { FilmLibrary } = require("../../models");
const { serializeCollection } = require("./serialize");

const createCollection = async (req, res) => {
  const { name, isPublic = false } = req.body;

  const collection = await FilmLibrary.create({
    name,
    isPublic: !!isPublic,
    owner: req.user._id,
    movies: [],
  });

  res.status(201).json({
    status: "success",
    code: 201,
    data: { result: serializeCollection(collection) },
  });
};

module.exports = createCollection;

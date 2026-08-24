const { FilmLibrary } = require("../../models");
const { serializeCollection } = require("./serialize");

const createCollection = async (req, res) => {
  const { _id } = req.user;
  const { name, isPublic } = req.body;
  const created = await FilmLibrary.create({
    name: name.trim(),
    isPublic: !!isPublic,
    owner: _id,
    movies: [],
  });
  res.status(201).json({
    status: "success",
    code: 201,
    data: { result: serializeCollection(created) },
  });
};

module.exports = createCollection;

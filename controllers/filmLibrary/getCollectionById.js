const { FilmLibrary } = require("../../models");
const { serializeCollection } = require("./serialize");
const { NotFound, Forbidden } = require("http-errors");

const getCollectionById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const collection = await FilmLibrary.findById(id);
  if (!collection) throw new NotFound("Not found");

  if (!collection.isPublic && !collection.owner.equals(userId)) {
    throw new Forbidden("Access denied");
  }

  res.json({
    status: "success",
    code: 200,
    data: { result: serializeCollection(collection) },
  });
};

module.exports = getCollectionById;

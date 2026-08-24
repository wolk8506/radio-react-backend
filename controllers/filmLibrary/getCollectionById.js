const { FilmLibrary } = require("../../models");
const { serializeCollection } = require("./serialize");

const getCollectionById = async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;
  const collection = await FilmLibrary.findById(id);
  if (
    !collection ||
    (String(collection.owner) !== String(_id) && !collection.isPublic)
  ) {
    return res
      .status(404)
      .json({ status: "error", code: 404, message: "Not found" });
  }
  res.json({
    status: "success",
    code: 200,
    data: { result: serializeCollection(collection) },
  });
};

module.exports = getCollectionById;

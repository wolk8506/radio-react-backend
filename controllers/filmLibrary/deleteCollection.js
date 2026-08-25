const { FilmLibrary } = require("../../models");
const { NotFound, Forbidden } = require("http-errors");

const deleteCollection = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const collection = await FilmLibrary.findById(id);
  if (!collection) throw new NotFound("Not found");

  if (!collection.owner.equals(userId)) {
    throw new Forbidden("Access denied");
  }

  await FilmLibrary.findByIdAndDelete(id);

  res.json({
    status: "success",
    code: 200,
    data: { result: { id: collection._id.toString() } },
  });
};

module.exports = deleteCollection;

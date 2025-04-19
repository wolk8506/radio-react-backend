const { Recipe } = require("../../models");

const getRecipe = async (req, res) => {
  //   const { _id } = req.user;
  const { page = 1, limit = 100 } = req.query;
  //   const { page = 1, limit = 100, favorite = [true, false] } = req.query;
  const skip = (page - 1) * limit;
  //   const contacts = await await Recipe.find({ owner: _id, favorite }, "", {
  const contacts = await await Recipe.find({
    skip,
    limit: Number(limit),
  });
  //   .populate("owner", "_id name email");
  res.json({
    status: "success",
    code: 200,
    data: {
      result: contacts,
    },
  });
};

module.exports = getRecipe;

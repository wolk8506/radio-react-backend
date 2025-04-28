const { User } = require("../../models");

// Удаление рецепта из избранного
const removeRecipeFavoriteById = async (req, res, next) => {
  const { recipeId } = req.params;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    user.favorites = user.favorites.filter(
      (favoriteId) => favoriteId.toString() !== recipeId
    );
    await user.save();

    res
      .status(200)
      .json({ message: "Рецепт удален из избранного", data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = removeRecipeFavoriteById;

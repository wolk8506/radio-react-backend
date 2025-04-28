const { User } = require("../../models");

// Добавление рецепта в избранное
const updateRecipeFavoriteById = async (req, res, next) => {
  const { recipeId } = req.params;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    if (user.favorites.includes(recipeId)) {
      return res
        .status(400)
        .json({ message: "Рецепт уже добавлен в избранное" });
    }

    user.favorites.push(recipeId);
    await user.save();

    res.status(200).json({
      message: "Рецепт добавлен в избранное",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = updateRecipeFavoriteById;

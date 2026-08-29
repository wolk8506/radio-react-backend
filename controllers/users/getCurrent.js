const getCurrent = async (req, res) => {
  const {
    email,
    subscription,
    name,
    avatarURL,
    walpaperURL,
    createdAt,
    _id,
    favorites,
    googleId,
    isAdmin,
    cities,
  } = req.user;
  res.json({
    status: "success",
    code: 200,
    data: {
      user: {
        email,
        subscription,
        name,
        avatarURL,
        walpaperURL,
        createdAt,
        favorites,
        googleId,
        isAdmin,
        cities,
        _id,
      },
    },
  });
};

module.exports = getCurrent;

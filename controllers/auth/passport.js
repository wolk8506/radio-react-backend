const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { User } = require("./models"); // Подключение вашей модели пользователя

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback", // Укажите ваш redirect URI
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Проверяем, есть ли пользователь уже в базе
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          // Если пользователя нет, создаём нового
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatarURL: profile.photos[0].value,
          });
          await user.save();
        }
        done(null, user);
      } catch (error) {
        done(error, false);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;

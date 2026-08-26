const axios = require("axios");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const shortid = require("shortid");
const jwt = require("jsonwebtoken");
const { User } = require("../../models");
const { SECRET_KEY } = process.env;

const SERVER_URL = process.env.SERVER_URL || "http://localhost:8080";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = `${SERVER_URL}/api/auth/google/callback`;

// state -> { mode: 'login' | 'connect', userId?, expires }
const oauthStates = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of oauthStates) if (v.expires < now) oauthStates.delete(k);
}, 5 * 60 * 1000);

const genState = () => crypto.randomBytes(16).toString("hex");

const buildAuthUrl = state => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

const redirectToFront = (res, status, token) => {
  const q = new URLSearchParams();
  if (token) q.set("token", token);
  q.set("status", status);
  res.redirect(`${FRONTEND_URL}/auth/google/callback?${q.toString()}`);
};

// GET /api/auth/google — начало OAuth для входа/регистрации
const googleInit = (req, res) => {
  const state = genState();
  oauthStates.set(state, { mode: "login", expires: Date.now() + 10 * 60 * 1000 });
  res.redirect(buildAuthUrl(state));
};

// POST /api/auth/google/connect/init — начало привязки (только для залогиненного)
const googleConnectInit = (req, res) => {
  const state = genState();
  oauthStates.set(state, {
    mode: "connect",
    userId: req.user._id,
    expires: Date.now() + 10 * 60 * 1000,
  });
  res.json({ url: buildAuthUrl(state) });
};

// GET /api/auth/google/callback — Google перенаправляет сюда
const googleCallback = async (req, res) => {
  const { code, state, error } = req.query;
  if (error || !state || !oauthStates.has(state) || !code) {
    return redirectToFront(res, "error");
  }
  const st = oauthStates.get(state);
  oauthStates.delete(state);

  try {
    // 1) обмен code на токен доступа
    const tokenResp = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    const accessToken = tokenResp.data.access_token;

    // 2) профиль пользователя
    const uiResp = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const { sub, email, name, picture } = uiResp.data;
    const lowerEmail = (email || "").toLowerCase();

    // 3а) привязка к уже залогиненному аккаунту
    if (st.mode === "connect") {
      const user = await User.findById(st.userId);
      if (!user) return redirectToFront(res, "error");
      user.googleId = sub;
      if (!user.avatarURL && picture) user.avatarURL = picture;
      await user.save();
      return redirectToFront(res, "connected");
    }

    // 3б) вход / регистрация
    const user = await User.findOne({ googleId: sub });
    if (user) {
      // аккаунт уже привязан к Google
      if (!user.verify) return redirectToFront(res, "pending");
      const jwtToken = jwt.sign({ id: user._id }, SECRET_KEY);
      await User.findByIdAndUpdate(user._id, { token: jwtToken });
      return redirectToFront(res, "ok", jwtToken);
    }

    // googleId нет — проверяем, не занят ли email обычным аккаунтом
    const byEmail = await User.findOne({ email: lowerEmail });
    if (byEmail) {
      // существующий аккаунт (email/пароль): НЕ создаём дубль,
      // просим привязать Google через личный кабинет
      return redirectToFront(res, "email_exists");
    }

    // новый пользователь — создаём НЕПОДТВЕРЖДЁННЫМ (ручное подтверждение, как сейчас)
    const gravatar = `https://www.gravatar.com/avatar/${crypto
      .createHash("md5")
      .update(lowerEmail)
      .digest("hex")}`;
    await User.create({
      googleId: sub,
      name: name || lowerEmail.split("@")[0],
      email: lowerEmail,
      password: bcrypt.hashSync(shortid(), 10), // обязательное поле, но пароль не используется
      verificationToken: shortid(),
      avatarURL: picture || gravatar,
      verify: false,
    });
    return redirectToFront(res, "pending");
  } catch (e) {
    console.error("[google] callback error:", e.message);
    return redirectToFront(res, "error");
  }
};

module.exports = { googleInit, googleConnectInit, googleCallback };

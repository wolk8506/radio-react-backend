const User = require("../models/user");
const createError = require("http-errors");

const {
  passwordGeneration,
  passwordCompare,
} = require("../services/passwordGeneration");
const { tokenGeneration } = require("../services/tokenGeneration");

const { v4 } = require("uuid");
const sendMail = require("../helpers/sendMail");
const urlVereficationToken = require("../services/urlVereficationToken");
const urlNewPasswordToken = require("../services/urlNewPasswordToken");

const registration = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const userName = await User.findOne({ name });
    const userEmail = await User.findOne({ email });

    if (userName && userEmail) {
      const error = createError(409, "name&email");
      throw error;
    }

    if (userName) {
      const error = createError(409, "name");
      throw error;
    }

    if (userEmail) {
      const error = createError(409, "email");
      throw error;
    }

    // ? hash password
    const hashPassword = await passwordGeneration(password);
    // ? post token
    const verificationToken = v4();
    const data = await User.create({
      name,
      email,
      password: hashPassword,
      verificationToken,
    });

    const mail = {
      to: email,
      subject: `Verify Your Books Reading Account`,
      html: urlVereficationToken(verificationToken),
    };
    await sendMail(mail);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      const error = createError(401, "email or password is incorrect");
      throw error;
    }

    const compare = await passwordCompare(password, user.password);
    if (!compare) {
      const error = createError(401, "email or password is incorrect");
      throw error;
    }

    if (!user.verify) {
      const error = createError(401, "this email is not verified");
      throw error;
    }

    const payload = { id: user._id };
    const token = tokenGeneration(payload);
    await User.findByIdAndUpdate(user._id, { token });

    res.status(200).json({ token, name: user.name });
  } catch (err) {
    if (err.message.includes("validation failed")) err.status = 400;
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const { _id } = req.user;
    await User.findByIdAndUpdate(_id, { token: null });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const current = async (req, res, next) => {
  const { name, email } = req.user;
  res.status(200).json({ name, email });
};

const getVerify = async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });

    if (!user) {
      const error = createError(404, "user is not found");
      throw error;
    }

    await User.findByIdAndUpdate(user._id, { verify: true });
    res.status(200).json({ message: "Verification successful" });
    // res.redirect('https://booker-app-rainb00w.netlify.app');
  } catch (err) {
    next(err);
  }
};

const repeatVerify = async (req, res, next) => {
  try {
    const { email } = req.body;
    const data = await User.findOne({ email });

    if (!data) {
      const error = createError(400, "this email is not registred");
      throw error;
    }

    const { verify, verificationToken } = data;

    if (verify) {
      const error = createError(400, "this email has already been verified");
      throw error;
    }

    const mail = {
      to: email,
      subject: `Verify Your Books Reading Account`,
      html: urlVereficationToken(verificationToken),
    };
    await sendMail(mail);

    res.status(200).json({ message: "Verification email sent" });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    const newPasswordToken = v4();

    if (!user) {
      const error = createError(401, "this email is not registred");
      throw error;
    }

    if (!user.verify) {
      const error = createError(401, "this email is not verified");
      throw error;
    }

    const newPassword = await passwordGeneration(password);
    await User.findByIdAndUpdate(user._id, { newPassword, newPasswordToken });

    const mail = {
      to: email,
      subject: `Books Reading Password Reset Confirmation`,
      html: urlNewPasswordToken(newPasswordToken),
    };
    await sendMail(mail);
    res.status(201).json({
      message:
        "We have sent you a link to your email to confirm your new password.",
    });
  } catch (err) {
    next(err);
  }
};

const getNewPassword = async (req, res, next) => {
  try {
    const { newPasswordToken } = req.params;
    const user = await User.findOne({ newPasswordToken });

    if (!user) {
      const error = createError(404, "user is not found");
      throw error;
    }

    const password = user.newPassword;

    await User.findByIdAndUpdate(user._id, {
      password,
      newPassword: "",
      newPasswordToken: "",
    });
    // res.status(200).json({ message: "Congratulations. You have confirmed the new password!" });
    res.redirect("https://booker-app-rainb00w.netlify.app");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registration,
  login,
  logout,
  current,
  getVerify,
  repeatVerify,
  forgotPassword,
  getNewPassword,
};

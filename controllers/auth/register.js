// const { Conflict } = require("http-errors");
const createError = require("http-errors");
const bcrypt = require("bcryptjs");
const { User } = require("../../models");
const gravatar = require("gravatar");
const shortid = require("shortid");
// const { sendEmail } = require("../../helpers");

const register = async (req, res, next) => {
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
    const hashPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    // ? post token
    const verificationToken = shortid();
    const avatarURL = gravatar.url(email);
    const data = await User.create({
      name,
      email,
      password: hashPassword,
      verificationToken,
      avatarURL,
    });

    // const mail = {
    //   to: email,
    //   subject: `Verify Your Books Reading Account`,
    //   html: urlVereficationToken(verificationToken),
    // };
    // await sendMail(mail);
    res.status(201).json({
      status: "success",
      code: 201,
      data,
    });
  } catch (err) {
    next(err);
  }
};

// const register = async (req, res) => {
//   const { email, password, name } = req.body;
//   const user = await User.findOne({ email });
//   if (user) {
//     throw new Conflict(`User with ${email} already exist`);
//   }
//   // const verificationToken = shortid();
//   const avatarURL = gravatar.url(email);
//   const hashPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
//   const result = await User.create({
//     email,
//     name,
//     password: hashPassword,
//     avatarURL,
//     // verificationToken,
//   });

//   // const mail = {
//   //   to: email,
//   //   subject: "Подтверждение email",
//   //   html: `<a target="_blank" href="http://localhost:8080/api/users/verify/${verificationToken}">Подтвердить email</a>`,
//   // };

//   // await sendEmail(mail);

//   // const { subscription, token } = result;
//   const { subscription } = result;
//   res.status(201).json({
//     status: "success",
//     code: 201,
//     data: {
//       // token,
//       user: {
//         email,
//         subscription,
//         name,
//       },
//     },
//   });
// };

module.exports = register;

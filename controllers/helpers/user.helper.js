import nodemailer from "nodemailer";
import ExpressError from "../../utils/ExpressError.utils.js";

export const sendForgotPassEmail = async (email, resetToken) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Password Reset",
    text: `You are receiving this email because you have requested to reset your password. Please click on the following link to reset your password: \n\n${process.env.CLIENT_URL}/reset-password/${resetToken}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    throw new ExpressError("Email could not be sent", 500);
  }
};

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

  let htmlContent = fs.readFileSync(
    "./controllers/helpers/email_templates/passwordResetEmail.html",
    "utf-8"
  );

  htmlContent = htmlContent.replace(
    "{{resetLink}}",
    `${process.env.CLIENT_URL}/reset-password/${resetToken}`
  );

  let mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Password Reset",
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    throw new ExpressError("Email could not be sent", 500);
  }
};

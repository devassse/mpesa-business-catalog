const nodemailer = require("nodemailer");

const sendResetPasswordEmail = async (email, resetLink) => {
  try {
    // Create a transporter object using SMTP transport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Set up email data
    const mailOptions = {
      from: `"Support" <${process.env.SMTP_FROM}>`, // sender address
      to: email, // list of receivers
      subject: "Reset Your Password", // Subject line
      text: `Click the following link to reset your password: ${resetLink}`, // plain text body
      html: `<p>Click the following link to reset your password:</p><a href="${resetLink}">${resetLink}</a>`, // html body
    };

    // Send mail with defined transport object
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send reset password email");
  }
};
module.exports = {
  sendResetPasswordEmail,
};

const User = require("../models/user"); // Adjust the path as needed
const jwt = require("jsonwebtoken");
const logUserAction = require("../controllers/generic_functions/user_logs");
const bcrypt = require("bcrypt");
const { sendResetPasswordEmail } = require("../func/send_mailer");

const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "3h" });
};

// login a user
const login = async (req, res) => {
  const { email, password } = req.body;
  const isLocal = process.env.LOCAL;
  let user = null;

  try {
    if (isLocal) {
      user = await User.loginLocal(email, password);
    } else {
      user = await User.login(email, password);
    }

    let userID = user._id || user.data._id.toString();

    // Create a token
    const token = createToken(userID);

    // Log user action
    // logUserAction(user._id, "User Auth", `login from ${req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress}`);

    res.status(200).json({
      email,
      token,
      id: userID,
      roles: user.roles || user.data.roles,
    });
  } catch (error) {
    console.log(error.message);
    res.status(404).json({ error: error.message });
  }
};

// signup a user
const signup = async (req, res) => {
  const { email, username, password, department, ticketId } = req.body;
  let user = null;
  const isLocal = process.env.LOCAL;

  try {
    if (isLocal) {
      user = await User.signupLocal(
        email,
        username,
        password,
        department,
        ticketId
      );
    } else {
      user = await User.signup(email, username, department, ticketId);
    }

    console.log("User found Local: ", user);

    res.status(201).json({
      message:
        "User registered successfully. Please wait for account activation or contact support.",
      user: {
        email: user.email,
        username: user.username,
        department: user.department,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// reset password
const forgotPassword = async (req, res) => {
  const { email } = req.body.email;

  try {
    //Find User by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a reset password link
    const resetLink = `${
      process.env.FRONTEND_URL
    }/reset-password?token=${createToken(user._id)}`;

    // Send the reset password link via email
    const sentEmail = await sendResetPasswordEmail(user.email, resetLink);
    console.log("Email sent: ", sentEmail);

    // If found, send him a reset password link
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

// reset password
const resetPassword = async (req, res) => {
  const params = req.body.params;

  const password = params.password;
  const token = params.token;

  if (!token) {
    return res.status(401).json({ error: "Authentication token is required" });
  }

  try {
    const user = await User.resetUserPassword(password, token);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// change password
const changePassword = async (req, res) => {

  const { currentpassword, newpassword, token } = req.body.params;
  
  // Decode the token to get the user ID
  if (!token) {
    return res.status(401).json({ error: "Authentication token is required" });
  }

  try {
    // Decode the JWT token to get user ID
    const decoded = jwt.decode(token);

    // Find the user by their ID
    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare the current password with the stored password
    const isMatch = await bcrypt.compare(currentpassword, user?.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newpassword, salt);

    // Update the user's password
    user.password = hashedNewPassword;
    // Set firstLogin to false if the password is changed
    user.firstLogin = false; 
    // Update the last password change date
    user.lastPasswordChange = new Date(); 

    await user.save();
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { signup, login, forgotPassword, resetPassword, changePassword };

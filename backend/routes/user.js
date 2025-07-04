const express = require("express");
const {
  login,
  signup,
  forgotPassword,
  resetPassword,
  changePassword
} = require("../controllers/user");
const authMiddleware = require("../middleware/auth_middleware");

const userRouter = express.Router();

userRouter.post("/sign", login);
userRouter.post("/signup", signup);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);
userRouter.post("/change-password", changePassword);
userRouter.get("/current-user", authMiddleware, (req, res) => {
  res.json(req.user);
});

module.exports = userRouter;

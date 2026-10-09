const {
  signupValidation,
  loginValidation,
  verifyOtpValidation,
} = require("./../Middlewares/AuthValidation");
const { signup, login, verifyOtp } = require("./../Controllers/AuthController");

const router = require("express").Router();

router.post("/signup", signupValidation, signup);

router.post("/login", loginValidation, login);

router.post("/verify-otp", verifyOtpValidation, verifyOtp);

module.exports = router;

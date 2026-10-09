const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("./../Models/User");
const { sendOtp, checkOtp, OtpError } = require("./../Utils/otpService");

const createLoginResponse = (user) => {
  const jwtToken = jwt.sign(
    { email: user.email, _id: user._id },
    process.env.JWT_SECRET,
    {
      expiresIn: "24h",
    },
  );

  return {
    message: "User logged in successfully",
    token: jwtToken,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
};

const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, password } = req.body;

    const user = await UserModel.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const mobileUser = await UserModel.findOne({ mobile });
    if (mobileUser) {
      return res
        .status(400)
        .json({ message: "Mobile number is already registered" });
    }

    const userData = new UserModel({
      firstName,
      lastName,
      email,
      mobile,
      password,
    });
    userData.password = await bcrypt.hash(password, 10);
    await userData.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const handleOtpError = (res, error, context) => {
  if (error instanceof OtpError) {
    return res.status(error.status).json({ message: error.message });
  }
  console.error(`Error during ${context}:`, error);
  res.status(500).json({ message: "Internal server error" });
};

// Step 1: user enters mobile number. If it is registered, send an OTP SMS.
const login = async (req, res) => {
  try {
    const { mobile } = req.body;

    const user = await UserModel.findOne({ mobile });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this mobile number" });
    }

    await sendOtp(mobile);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    handleOtpError(res, error, "login");
  }
};

// Step 2: user enters the OTP. If it matches, log them in.
const verifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    const isOtpValid = await checkOtp(mobile, otp);
    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = await UserModel.findOne({ mobile });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this mobile number" });
    }

    res.status(200).json(createLoginResponse(user));
  } catch (error) {
    handleOtpError(res, error, "OTP verification");
  }
};

module.exports = {
  signup,
  login,
  verifyOtp,
};

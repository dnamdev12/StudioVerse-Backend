const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("./../Models/User");

const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, password } = req.body;

    const user = await UserModel.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
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

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });
    const errorMessage = "Invalid email or password";
    if (!user) {
      return res.status(403).json({ message: errorMessage });
    }

    const ispasswordValid = await bcrypt.compare(password, user.password);
    if (!ispasswordValid) {
      return res.status(403).json({ message: errorMessage });
    }

    const jwtToken = jwt.sign(
      { email: user.email, _id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      },
    );

    res
      .status(200)
      .json({
        message: "User logged in successfully",
        token: jwtToken,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  signup,
  login,
};

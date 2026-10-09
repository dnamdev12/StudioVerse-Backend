const Joi = require("joi");

const mobileSchema = Joi.string()
  .pattern(/^\+\d{8,18}$/)
  .required()
  .messages({ "string.pattern.base": "Enter a valid mobile number" });

const signupValidation = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().required().min(2).max(30),
    lastName: Joi.string().required().min(2).max(30),
    email: Joi.string().email().required(),
    mobile: mobileSchema,
    password: Joi.string().min(6).required(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  next();
};

const loginValidation = (req, res, next) => {
  const schema = Joi.object({
    mobile: mobileSchema,
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  next();
};

const verifyOtpValidation = (req, res, next) => {
  const schema = Joi.object({
    mobile: mobileSchema,
    otp: Joi.string()
      .pattern(/^\d{6}$/)
      .required()
      .messages({ "string.pattern.base": "OTP must be 6 digits" }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  next();
};

module.exports = {
  signupValidation,
  loginValidation,
  verifyOtpValidation,
};

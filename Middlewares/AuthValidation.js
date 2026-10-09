const Joi = require("joi");

const signupValidation = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().required().min(2).max(30),
    lastName: Joi.string().required().min(2).max(30),
    email: Joi.string().email().required(),
    mobile: Joi.string()
      .pattern(/^\+\d{8,18}$/)
      .required()
      .messages({ "string.pattern.base": "Enter a valid mobile number" }),
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
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
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
};

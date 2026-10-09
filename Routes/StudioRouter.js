const router = require("express").Router();
const ensureAuthenticated = require("./../Middlewares/Auth");

router.get("/", ensureAuthenticated, (req, res) => {
  res.json({ message: "Studio data", user: req.user });
});

module.exports = router;

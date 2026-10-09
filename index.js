const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const cors = require("cors");
const authRouter = require("./Routes/AuthRouter");
const studioRouter = require("./Routes/StudioRouter");
require("./Models/db");
const app = express();

const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/api/auth", authRouter);
app.use("/api/studio", studioRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

//divyanamdev_db_user
//30lCS4g0278glely

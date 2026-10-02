const express = require("express");

const router = express.Router();

const { authMiddleware } = require("../middleware/auth");
const {
  getUserTheme,
  updateUserTheme,
} = require("../controllers/themeController");

router.use(authMiddleware);

router.get("/", getUserTheme);
router.patch("/", updateUserTheme);

module.exports = router;

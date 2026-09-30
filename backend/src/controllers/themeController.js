const User = require("../models/User");

const getUserTheme = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      theme: req.user.theme || "theme1",
    });
  } catch (error) {
    console.error("Get user theme error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while getting user theme.",
    });
  }
};

const updateUserTheme = async (req, res) => {
  try {
    const { theme } = req.body;

    const allowedThemes = ["theme1", "theme2", "theme3", "theme4"];

    if (!allowedThemes.includes(theme)) {
      return res.status(400).json({
        success: false,
        message: "Invalid theme.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { theme },
      { new: true, runValidators: true },
    ).select("theme");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Theme updated successfully.",
      theme: user.theme,
    });
  } catch (error) {
    console.error("Update user theme error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating user theme.",
    });
  }
};

module.exports = {
  getUserTheme,
  updateUserTheme,
};

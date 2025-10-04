// controllers/protected.controllers.js

/**
 * Get user profile
 */
export const getProfile = async (req, res) => {
  try {
    // req.user is populated by authenticateJWT middleware
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.id;

    // Add your update logic here
    // For example: await User.update({ username }, { where: { id: userId } });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Example protected data endpoint
 */
export const getProtectedData = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "This is protected data",
      data: {
        userId: req.user.id,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get protected data error:', error);
    return res.status(500).json({ message: "Server error" });
  }
};
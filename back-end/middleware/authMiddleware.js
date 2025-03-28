// controllers/authController.js
const db = require("../db/connection");
const bcrypt = require("bcrypt");

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    console.log("Login request body:", req.body);

    if (!phone || !password) {
      return res.status(400).json({
        message: "Phone number and password are required.",
      });
    }

    // First, check for owner credentials from the buildings table (plain text check)
    let [rows] = await db.query(
      "SELECT * FROM buildings WHERE owner_phone = ? AND password = ?",
      [phone, password]
    );

    if (rows.length > 0) {
      const owner = rows[0]; // Full owner data
      const token = "owner-token-" + owner.id; // Dummy token for demonstration
      console.log("Owner authenticated:", owner);
      return res.json({
        message: "Owner login successful.",
        type: "owner",
        description:
          "Your account is registered as an owner. You have full building management access.",
        owner: owner, // Return owner data under the key "owner"
        token: token,
      });
    }

    // If no owner match, then try authenticating as a user (users table, bcrypt-based check)
    [rows] = await db.query("SELECT * FROM users WHERE phone_number = ?", [phone]);

    if (rows.length > 0) {
      const user = rows[0];
      // Compare the provided password with the stored bcrypt hash
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials." });
      }
      const token = "user-token-" + user.id; // Dummy token for demonstration
      console.log("User authenticated:", user);
      return res.json({
        message: "User login successful.",
        type: "user",
        description:
          "Your account is registered as a sub-user. You have access to limited functionalities.",
        owner: user, // Return user data under the key "user"
        token: token,
      });
    }

    // If neither owner nor user is found, return an unauthorized response.
    return res.status(401).json({ message: "Invalid credentials." });
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      message: "Server error during authentication.",
    });
  }
};

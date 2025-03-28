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

    // --- Check for owner credentials ---
    let [rows] = await db.query(
      "SELECT * FROM buildings WHERE owner_phone = ? AND password = ?",
      [phone, password]
    );
    if (rows.length > 0) {
      const owner = rows[0]; // full owner data from buildings table
      const token = "owner-token-" + owner.id;
      console.log("Owner authenticated:", owner);
      return res.json({
        message: "Owner login successful.",
        type: "owner",
        owner: owner, // key: "owner"
        token: token,
      });
    }

    // --- If no owner match, check for user credentials ---
    [rows] = await db.query(
      "SELECT * FROM users WHERE phone_number = ?",
      [phone]
    );
    if (rows.length > 0) {
      const user = rows[0];
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials." });
      }
      const token = "user-token-" + user.id;
      console.log("User authenticated:", user);
      return res.json({
        message: "User login successful.",
        type: "user",
        user: user, // key: "user"
        token: token,
      });
    }

    return res.status(401).json({ message: "Invalid credentials." });
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      message: "Server error during authentication.",
    });
  }
};

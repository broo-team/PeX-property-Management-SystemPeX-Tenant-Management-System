// middleware/authUser.js
const db = require("../db/connection");

exports.authenticateUser = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    console.log("User auth middleware req.body:", req.body);

    if (!phone || !password) {
      return res
        .status(400)
        .json({ message: "Phone number and password are required." });
    }

    // Query the 'users' table by phone_number and password
    const [rows] = await db.query(
      "SELECT * FROM users WHERE phone_number = ? AND password = ?",
      [phone, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Attach the authenticated user to the request object.
    req.user = rows[0];
    next();
  } catch (error) {
    console.error("User authentication error:", error);
    res.status(500).json({ message: "Server error during user authentication." });
  }
};

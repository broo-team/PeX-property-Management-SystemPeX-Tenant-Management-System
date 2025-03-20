// middleware/authMiddleware.js
const db = require("../db/connection");

exports.authenticateOwner = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    console.log("authMiddleware req.body:", req.body);

    if (!phone || !password) {
      return res
        .status(400)
        .json({ message: "Phone number and password are required." });
    }

    const [rows] = await db.query(
      "SELECT * FROM buildings WHERE owner_phone = ? AND password = ?",
      [phone, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    req.owner = rows[0]; // Attach owner data to the request
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Server error during authentication." });
  }
};

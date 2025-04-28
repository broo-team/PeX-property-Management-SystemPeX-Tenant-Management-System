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
    let [ownerRows] = await db.query(
      "SELECT * FROM buildings WHERE owner_phone = ?",
      [phone]
    );
    if (ownerRows.length > 0) {
      const owner = ownerRows[0];
      // Handle case where password is still the default 'Pex123'
      if (owner.password === password) {
        const token = "owner-token-" + owner.id;
        console.log("Owner authenticated:", owner);
        return res.json({
          message: "Owner login successful.",
          type: "owner",
          owner: owner, // key: "owner"
          token: token,
        });
      }
      // If the password is not the default, use bcrypt for comparison
      const validOwnerPassword = await bcrypt.compare(password, owner.password);
      if (validOwnerPassword) {
        const token = "owner-token-" + owner.id;
        console.log("Owner authenticated:", owner);
        return res.json({
          message: "Owner login successful.",
          type: "owner",
          owner: owner, // key: "owner"
          token: token,
        });
      }
    }

    // --- If no owner match, check for user credentials ---
    let [userRows] = await db.query(
      "SELECT * FROM users WHERE phone_number = ?",
      [phone]
    );
    if (userRows.length > 0) {
      const user = userRows[0];
      // Check password for user using bcrypt
      const validUserPassword = await bcrypt.compare(password, user.password);
      if (!validUserPassword) {
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

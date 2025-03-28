// controllers/userController.js
const bcrypt = require("bcrypt");
const db = require("../db/connection");

exports.createUser = async (req, res) => {
  try {
    // Expect building_id to be sent directly in the request body along with the user details
    const { building_id, full_name, phone_number, password, role } = req.body;
    console.log(req.body)
    if (!building_id || !full_name || !phone_number || !password || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if a user with the same phone number exists for this building
    const [existingUsers] = await db.query(
      "SELECT * FROM users WHERE phone_number = ? AND building_id = ?",
      [phone_number, building_id]
    );
    if (existingUsers.length > 0) {
      return res
        .status(400)
        .json({ message: "User with this phone number already exists." });
    }

    // Hash the password and insert the new sub‑user into the database
    const hashedPassword = await bcrypt.hash(password, 10);
    const insertQuery = `
      INSERT INTO users (building_id, full_name, phone_number, password, role)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(insertQuery, [
      building_id,
      full_name,
      phone_number,
      hashedPassword,
      role,
    ]);

    // Respond with the new user details (or a token if needed later)
    res.status(201).json({
      message: "User created successfully.",
      user: {
        id: result.insertId,
        building_id,
        full_name,
        phone_number,
        role,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error while creating user." });
  }
};


exports.getUsers = async (req, res) => {
  const query = "SELECT * FROM users";
  try {
    const [results] = await db.query(query);
    return res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

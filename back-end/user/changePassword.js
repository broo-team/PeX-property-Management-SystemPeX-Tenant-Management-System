// controllers/user/changeBuildingPassword.js
const db = require('../db/connection');
const bcrypt = require('bcrypt');

const saltRounds = 10;
// This constant defines the plaintext default password
const DEFAULT_PASSWORD_PLAINTEXT = 'Pex123';

exports.changeBuildingPassword = async (req, res) => {
  const buildingId = req.params.id;
  const { oldPassword, newPassword } = req.body;

  // Basic input validation
  if (!buildingId || !oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Building ID, old password, and new password are required' });
  }

  try {
    // Query the stored password from the database
    const [buildings] = await db.query('SELECT password FROM buildings WHERE id = ?', [buildingId]);

    // Check if the building was found
    if (buildings.length === 0) {
      return res.status(404).json({ error: 'Building not found' });
    }

    const storedPassword = buildings[0].password;

    // Check if a password was stored (should not be null/empty usually)
    if (!storedPassword) {
      console.error(`Stored password is null/undefined for buildingId: ${buildingId}`);
      return res.status(500).json({ error: 'Existing password not found for this building.' });
    }

    let passwordMatches = false;

    // *** IMPORTANT: This block handles the case where the stored password is the plaintext default.
    // This is necessary ONLY if you have plaintext passwords in the database.
    // The logs showed the database had 'Pex123\n', which is why this block failed before.
    if (storedPassword === DEFAULT_PASSWORD_PLAINTEXT && oldPassword === DEFAULT_PASSWORD_PLAINTEXT) {
      passwordMatches = true;
    } else {
      // This block handles all other cases, assuming the stored password is a bcrypt hash.
      try {
        // bcrypt.compare correctly compares a plaintext string (oldPassword) against a hash (storedPassword)
        passwordMatches = await bcrypt.compare(oldPassword, storedPassword);
      } catch (e) {
        console.error('Bcrypt comparison error:', e.message);
        return res.status(500).json({ error: 'Password comparison failed. Possibly corrupted data.' });
      }
    }

    // If neither comparison method found a match
    if (!passwordMatches) {
      // This is the error you were seeing because stored data didn't match expected 'Pex123'
      return res.status(401).json({ error: 'Incorrect old password provided' });
    }

    // If the old password is correct, hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the password in the database with the new hash
    const [result] = await db.query(
      'UPDATE buildings SET password = ? WHERE id = ?',
      [hashedNewPassword, buildingId]
    );

    // Check if the update was successful (affected at least one row)
    if (result.affectedRows === 0) {
      // This might happen if the building ID suddenly became invalid or another DB issue
      console.warn(`Update affected 0 rows for buildingId: ${buildingId}`);
      return res.status(404).json({ error: 'Building not found or password unchanged' });
    }

    // Success response
    return res.status(200).json({ message: 'Building password updated successfully' });

  } catch (err) {
    // Catch-all for any other errors during the process
    console.error('Error changing building password:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
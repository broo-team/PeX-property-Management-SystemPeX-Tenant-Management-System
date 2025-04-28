const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// Import the database connection pool from your db.js file
const db = require('../../db/connection'); // Adjust path based on your structure
const config = require('../config'); // Import your config file for the JWT secret

// Controller for creator registration
exports.register = async (req, res) => {
    const { full_name, email, phone_number, location, password } = req.body;

    // Basic validation
    if (!full_name || !email || !password) {
        return res.status(400).json({ message: 'Full name, email, and password are required.' });
    }

    try {
        // Check if email already exists
        // Using parameterized query to prevent SQL injection
        const [existingCreators] = await db.query('SELECT * FROM creators WHERE email = ?', [email]);

        if (existingCreators.length > 0) {
            return res.status(409).json({ message: 'Email already in use.' });
        }

        // Hash the password
        const saltRounds = 10; // Cost factor for hashing
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Insert new creator into the database
        // Using parameterized query
        const [result] = await db.query(
            'INSERT INTO creators (full_name, email, phone_number, location, password_hash) VALUES (?, ?, ?, ?, ?)',
            [full_name, email, phone_number, location, password_hash]
        );

        // Note: mysql2/promise INSERT does not return the inserted row by default like pg.
        // You might need to perform another SELECT query to get the full new creator object,
        // or construct it from the request body and the inserted ID if needed.
        // For simplicity here, we'll just confirm success.
        // The inserted ID is available in result.insertId

        // Respond with success message and potentially the new creator's ID
        res.status(201).json({ message: 'Creator registered successfully!', creatorId: result.insertId, email: email, full_name: full_name });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering creator.', error: error.message });
    }
};

// Controller for creator login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Find the creator by email
        const [rows] = await db.query('SELECT * FROM creators WHERE email = ?', [email]);
        const creator = rows[0];

        // Check if creator exists
        if (!creator) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Compare the provided password with the stored hash
        const passwordMatch = await bcrypt.compare(password, creator.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Generate a JWT token
        // Use a strong, secret key from your config file
        const token = jwt.sign(
            { id: creator.id, email: creator.email }, // Payload: include user info
            config.jwtSecret, // Secret key for signing
            { expiresIn: '1h' } // Token expiration time
        );

        // Respond with the token
        res.json({ message: 'Login successful!', token });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in.', error: error.message });
    }
};

// Controller to get details of the currently authenticated creator
exports.getMe = async (req, res) => {
    // The authMiddleware attaches the user info to req.user
    const creatorId = req.user.id;

    try {
        const [rows] = await db.query('SELECT id, full_name, email, phone_number, location FROM creators WHERE id = ?', [creatorId]);
        const creator = rows[0];

        if (!creator) {
            // This case should ideally not happen if authMiddleware works correctly,
            // but it's good practice to check.
            return res.status(404).json({ message: 'Creator not found.' });
        }

        res.json({ creator });

    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ message: 'Error fetching creator details.', error: error.message });
    }
};


// Controller to get details of a specific creator by ID
// Requires authentication, and potentially authorization logic
exports.getCreator = async (req, res) => {
    const creatorId = req.params.id; // ID from the URL parameter

    try {
        // In a real app, add authorization logic here:
        // - Is the authenticated user allowed to view this creator's profile?
        // - Maybe only allow viewing their own profile, or if they have admin rights.
        // For simplicity in this example, we just fetch by ID.

        const [rows] = await db.query('SELECT id, full_name, email, phone_number, location FROM creators WHERE id = ?', [creatorId]);
        const creator = rows[0];

        if (!creator) {
            return res.status(404).json({ message: 'Creator not found.' });
        }

        res.json({ creator });

    } catch (error) {
        console.error('GetCreator error:', error);
        res.status(500).json({ message: 'Error fetching creator details.', error: error.message });
    }
};

// Controller to update creator details
// Requires authentication and authorization
exports.updateCreator = async (req, res) => {
    const creatorId = req.params.id; // ID from the URL parameter
    const authenticatedUserId = req.user.id; // ID of the currently logged-in user
    const { full_name, phone_number, location } = req.body; // Allow updating these fields

    // Prevent users from updating other users' accounts unless they are admin
    if (parseInt(creatorId, 10) !== authenticatedUserId /* && !req.user.isAdmin */) {
        return res.status(403).json({ message: 'Unauthorized to update this creator.' });
    }

    try {
        // Build the update query dynamically based on provided fields
        const fields = [];
        const params = [];

        if (full_name !== undefined) {
            fields.push(`full_name = ?`);
            params.push(full_name);
        }
        if (phone_number !== undefined) {
            fields.push(`phone_number = ?`);
            params.push(phone_number);
        }
        if (location !== undefined) {
            fields.push(`location = ?`);
            params.push(location);
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: 'No fields provided for update.' });
        }

        // Add the creator ID to the parameters for the WHERE clause
        params.push(creatorId);

        const sql = `UPDATE creators SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

        const [result] = await db.query(sql, params);

        if (result.affectedRows === 0) {
             // This might happen if the ID from the URL didn't match a creator
             return res.status(404).json({ message: 'Creator not found.' });
        }

        // Fetch the updated creator to return in the response
        const [updatedRows] = await db.query('SELECT id, full_name, email, phone_number, location FROM creators WHERE id = ?', [creatorId]);
        const updatedCreator = updatedRows[0];

        res.json({ message: 'Creator updated successfully!', creator: updatedCreator });

    } catch (error) {
        console.error('UpdateCreator error:', error);
        res.status(500).json({ message: 'Error updating creator.', error: error.message });
    }
};

// Controller to delete a creator account
// Requires authentication and authorization
exports.deleteCreator = async (req, res) => {
    const creatorId = req.params.id; // ID from the URL parameter
    const authenticatedUserId = req.user.id; // ID of the currently logged-in user

    // Prevent users from deleting other users' accounts unless they are admin
    if (parseInt(creatorId, 10) !== authenticatedUserId /* && !req.user.isAdmin */) {
        return res.status(403).json({ message: 'Unauthorized to delete this creator.' });
    }

    try {
        const [result] = await db.query('DELETE FROM creators WHERE id = ?', [creatorId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Creator not found.' });
        }

        res.json({ message: 'Creator deleted successfully!' });

    } catch (error) {
        console.error('DeleteCreator error:', error);
        res.status(500).json({ message: 'Error deleting creator.', error: error.message });
    }
};
// controller/sass/creatorController.js
// ... (existing imports and functions: register, login, getMe, getCreator, updateCreator, deleteCreator)

// Add the controller for changing password
exports.changePassword = async (req, res) => {
        // authMiddleware ensures req.user is available
        const authenticatedUserId = req.user.id;
        const { current_password, new_password } = req.body;
    
        // Basic validation
        if (!current_password || !new_password) {
            return res.status(400).json({ message: 'Current password and new password are required.' });
        }
    
        // Add validation for new_password complexity if needed (e.g., minimum length)
    
        try {
            // 1. Fetch the user from the database using the authenticated user ID
            const [rows] = await db.query('SELECT id, password_hash FROM creators WHERE id = ?', [authenticatedUserId]);
            const creator = rows[0];
    
            // Should not happen if authMiddleware is working, but good defensive check
            if (!creator) {
                return res.status(404).json({ message: 'Authenticated user not found.' });
            }
    
            // 2. Compare the provided current_password with the stored hash
            const passwordMatch = await bcrypt.compare(current_password, creator.password_hash);
    
            // 3. If current password doesn't match, return an error
            if (!passwordMatch) {
                // Using 401 Unauthorized is common here, or 400 Bad Request
                return res.status(401).json({ message: 'Incorrect current password.' });
            }
    
            // 4. Hash the new password
            const saltRounds = 10;
            const new_password_hash = await bcrypt.hash(new_password, saltRounds);
    
            // 5. Update the password hash in the database for the authenticated user
            const [result] = await db.query(
                'UPDATE creators SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [new_password_hash, authenticatedUserId]
            );
    
            // Check if update was successful
            if (result.affectedRows === 0) {
                // This might happen if the user was somehow not found again, less likely
                return res.status(500).json({ message: 'Failed to update password in database.' });
            }
    
            // 6. Respond with success
            res.status(200).json({ message: 'Password updated successfully!' });
    
        } catch (error) {
            console.error('ChangePassword error:', error);
            res.status(500).json({ message: 'Error changing password.', error: error.message });
        }
    };
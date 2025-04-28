// middleware/authMiddleware.js
// This file contains the middleware for authenticating requests using JWT.

const jwt = require('jsonwebtoken');
const config = require('../controller/config'); // Import your config file for the JWT secret

// Middleware function to protect routes
const authsaas = (req, res, next) => {
    // Get the token from the Authorization header
    // Format: "Bearer TOKEN"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token after "Bearer"

    // If no token is provided, return 401 Unauthorized
    if (token == null) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    // Verify the token
    // Use the secret key from your config file
    jwt.verify(token, config.jwtSecret, (err, user) => {
        // If verification fails (invalid signature, expired, etc.), return 403 Forbidden
        if (err) {
            console.error('JWT Verification Error:', err.message);
            // Depending on the error type (e.g., TokenExpiredError), you might return a different status
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }

        // If verification succeeds, attach the user payload from the token to the request object
        // The 'user' here is the payload we signed in the login controller ({ id: creator.id, email: creator.email })
        req.user = user;

        // Proceed to the next middleware or route handler
        next();
    });
};

module.exports = authsaas;

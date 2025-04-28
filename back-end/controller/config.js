
module.exports = {
    // Replace with a strong, unique secret key for signing JWTs.
    // Store this securely, ideally using environment variables in production.
    // You can also load this from process.env if using dotenv.
    jwtSecret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_replace_me_12345',

    // Add other configuration variables here if needed
    // Database config might be in your db.js or loaded via dotenv elsewhere
};

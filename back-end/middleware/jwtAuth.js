// middleware/jwtAuth.js
const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET || "your_jwt_secret";

const jwtAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, secret);
      req.user = decoded; // Attach decoded payload (should include building_id)
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token." });
    }
  } else {
    return res.status(401).json({ message: "No token provided." });
  }
};

module.exports = jwtAuth;

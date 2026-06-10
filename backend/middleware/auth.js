const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "smartfridge_dev_secret_change_this";

/**
 * Auth middleware to verify JWT token
 */
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Token is not valid" });
  }
};

module.exports = auth;


const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");

const requireAdmin = async (req, res, next) => {
  try {
    const token = req.cookies?.admin_token;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (decoded.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    const admin = await Admin.findById(decoded.adminId);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError") {
      return res.status(401).json({
        message: "Invalid or expired session",
      });
    }

    next(error);
  }
};

module.exports = requireAdmin;

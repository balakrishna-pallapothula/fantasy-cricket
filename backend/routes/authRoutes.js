const requireAdmin = require("../middleware/authMiddleware");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


const Admin = require("../models/admin");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string" ||
      !email.trim() || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const admin = await Admin.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!admin) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { adminId: admin._id.toString(), role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
      path: "/",
    });

    return res.json({
      message: "Login successful",
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login failed:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.post('/logout', requireAdmin, (req, res) => {
  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return res.status(200).json({
    message: 'Logged out successfully',
  });
});

router.get(
  "/me",
  (req, res, next) => {
    next();
  },
  requireAdmin,
  (req, res) => {
    res.json({
      message: "Authenticated admin",
      admin: {
        id: req.admin._id,
        email: req.admin.email,
        role: req.admin.role,
      },
    });
  }
);

module.exports = router;

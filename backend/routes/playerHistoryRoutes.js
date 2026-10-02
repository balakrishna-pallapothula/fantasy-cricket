const express = require("express");
const PlayerHistory = require("../models/playerHistory");

const router = express.Router();

/**
 * CREATE play history
 */
router.post("/", async (req, res) => {
  try {
    const { playerId, teamId, year, soldPrice } = req.body;

    if (!playerId || !teamId || !year || !soldPrice) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const history = await PlayerHistory.create({
      playerId,
      teamId,
      year,
      soldPrice
    });

    res.status(201).json({
      message: "Play history created",
      data: history
    });
  } catch (error) {
    // Handle duplicate year error
    if (error.code === 11000) {
      return res.status(400).json({
        message: "History already exists for this player in this year"
      });
    }

    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

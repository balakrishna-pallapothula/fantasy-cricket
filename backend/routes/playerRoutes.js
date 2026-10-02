const express = require("express");
const Player = require("../models/player");

const router = express.Router();

/**
 * CREATE player
 * POST /api/players
 */
router.post("/", async (req, res) => {
  try {
    console.log("REQ BODY 👉", req.body);

    const {
      name,
      role,
      country,
      basePrice,
      matches,
      runs,
      battingAverage,
      highestScore,
      wickets,
      bowlingAverage,
      economy
    } = req.body;

    if (
      !name ||
      !role ||
      !country ||
      basePrice === undefined
    ) {
      return res.status(400).json({
        message: "All required fields must be provided"
      });
    }

    const player = await Player.create({
      name,
      role,
      country,
      basePrice,
      matches,
      runs,
      battingAverage,
      highestScore,
      wickets,
      bowlingAverage,
      economy
    });

    res.status(201).json({
      message: "Player created successfully",
      data: player
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET all players
 */
router.get("/", async (req, res) => {
  const players = await Player.find().populate("teamId", "name franchise");
  res.json(players);
});

module.exports = router;

const express = require("express");
const Player = require("../models/player");

const router = express.Router();

/**
 * GET players by team
 * GET /api/teams/:teamId/players
 */
router.get("/:teamId/players", async (req, res) => {
  try {
    const { teamId } = req.params;

    const players = await Player.find({ teamId })
      .populate("teamId", "name franchise");

    if (!players.length) {
      return res.status(404).json({
        message: "No players found for this team"
      });
    }

    res.json({
      teamId,
      totalPlayers: players.length,
      data: players
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

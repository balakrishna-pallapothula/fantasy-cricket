const express = require("express");
const Player = require("../models/player");
const PlayerHistory = require("../models/playerHistory");

const router = express.Router();

router.get("/:id/profile", async (req, res) => {
  try {
    const player = await Player.findById(req.params.id)
      .populate("teamId", "name franchise");

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    const history = await PlayerHistory.find({ playerId: player._id })
      .populate("teamId", "name franchise")
      .sort({ year: -1 });

    res.json({ player, auctionHistory: history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

const express = require("express");
const Auction = require("../models/auction");
const Player = require("../models/player");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { playerId, setNumber } = req.body;

    // 1. Check required values
    if (!playerId || setNumber === undefined) {
      return res.status(400).json({
        message: "playerId and setNumber are required"
      });
    }

    // 2. Check whether the player exists
    const player = await Player.findById(playerId);

    if (!player) {
      return res.status(404).json({
        message: "Player not found"
      });
    }

    const existingAuction = await Auction.findOne({ playerId });

    if (existingAuction) {
      return res.status(409).json({
        message: "Player is already added to the auction"
      });
    }

    // 3. Create auction entry
    const auction = await Auction.create({
      playerId: player._id,
      setNumber,
      basePrice: player.basePrice
    });

    // 4. Send successful response
    return res.status(201).json({
      message: "Player added to auction set",
      data: auction
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const auctions = await Auction.find()
      .populate("playerId");

    res.json(auctions);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});


module.exports = router;
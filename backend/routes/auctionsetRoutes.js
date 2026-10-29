const requireAdmin = require("../middleware/authMiddleware");
const express = require("express");
const mongoose = require("mongoose");
const Player = require("../models/player");
const router = express.Router();
const AuctionSet = require("../models/auctionSet");
const Auction = require("../models/auction");


router.get("/", async (req, res) => {
  try {
    const auctionSets = await AuctionSet.find()
      .populate("players");

    res.status(200).json(auctionSets);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { setNumber, name, role, players } = req.body;

    if (
      !Number.isInteger(setNumber) ||
      setNumber < 1 ||
      !name?.trim() ||
      !role ||
      !Array.isArray(players)
    ) {
      return res.status(400).json({
        message: "Invalid auction set details"
      });
    }

    const existingSetNumber = await AuctionSet.findOne({
      setNumber
    });

    if (existingSetNumber) {
      return res.status(409).json({
        message: "Auction set number already exists"
      });
    }

    const invalidPlayerIds = players.filter(
      (playerId) => !mongoose.isValidObjectId(playerId)
    );

    if (invalidPlayerIds.length > 0) {
      return res.status(400).json({
        message: "One or more player IDs are invalid"
      });
    }

    const uniquePlayerIds = new Set(players);

    if (uniquePlayerIds.size !== players.length) {
      return res.status(400).json({
        message: "Duplicate players are not allowed in an auction set"
      });
    }

    const existingPlayers = await Player.find({
      _id: { $in: players }
    });

    if (existingPlayers.length !== new Set(players).size) {
      return res.status(400).json({
        message: "One or more players do not exist"
      });
    }

    const hasRoleMismatch = existingPlayers.some(
      (player) => player.role !== role
    );

    if (hasRoleMismatch) {
      return res.status(400).json({
        message: "All players must match the auction set role"
      });
    }

    const existingAuctions = await Auction.find({
      playerId: { $in: players }
    });

    if (existingAuctions.length > 0) {
      return res.status(400).json({
        message: "One or more players have already been auctioned"
      });
    }

    const existingSet = await AuctionSet.findOne({
      players: { $in: players }
    });

    if (existingSet) {
      return res.status(400).json({
        message: "One or more players already belong to another auction set"
      });
    }
    const auctionSet = await AuctionSet.create({
      setNumber,
      name: name.trim(),
      role,
      players
    });

    res.status(201).json({
      message: "Auction set created successfully",
      data: auctionSet
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Auction set number already exists"
      });
    }

    console.error("Failed to create auction set:", error);

    return res.status(500).json({
      message: "Failed to create auction set"
    });
  }
});

router.patch("/:id/start", requireAdmin, async (req, res) => {
  try {
    const auctionSet = await AuctionSet.findById(req.params.id);

    if (!auctionSet) {
      return res.status(404).json({
        message: "Auction set not found"
      });
    }

    if (auctionSet.status !== "UPCOMING") {
      return res.status(400).json({
        message: "Only UPCOMING sets can be started"
      });
    }

    if (auctionSet.players.length === 0) {
      return res.status(400).json({
        message: "Cannot start an empty auction set"
      });
    }

    const activeSet = await AuctionSet.findOne({
      status: "IN_PROGRESS"
    });

    if (activeSet) {
      return res.status(409).json({
        message: "Another auction set is already in progress"
      });
    }

    auctionSet.status = "IN_PROGRESS";
    await auctionSet.save();

    res.status(200).json({
      message: "Auction set started successfully",
      data: auctionSet
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Another auction set is already in progress'
      });
    }

    console.error('Failed to start auction set:', error);

    res.status(500).json({
      message: 'Failed to start auction set'
    });
  }
}
);

router.patch("/:id/complete", requireAdmin, async (req, res) => {
  try {
    const auctionSet = await AuctionSet.findById(req.params.id);

    if (!auctionSet) {
      return res.status(404).json({
        message: "Auction set not found"
      });
    }

    if (auctionSet.status !== "IN_PROGRESS") {
      return res.status(400).json({
        message: "Only an IN_PROGRESS set can be completed"
      });
    }

    const auctions = await Auction.find({
      setNumber: auctionSet.setNumber,
      playerId: { $in: auctionSet.players }
    });

    const completedPlayerIds = new Set(
      auctions
        .filter((auction) =>
          ["SOLD", "UNSOLD"].includes(auction.status)
        )
        .map((auction) => auction.playerId.toString())
    );

    const allPlayersCompleted =
      auctionSet.players.length > 0 &&
      auctionSet.players.every((playerId) =>
        completedPlayerIds.has(playerId.toString())
      );

    if (!allPlayersCompleted) {
      return res.status(400).json({
        message: "All player auctions must be SOLD or UNSOLD"
      });
    }

    auctionSet.status = "COMPLETED";
    await auctionSet.save();

    return res.status(200).json({
      message: "Auction set completed successfully",
      data: auctionSet
    });
  } catch (error) {
    console.error("Failed to complete auction set:", error);

    return res.status(500).json({
      message: "Failed to complete auction set"
    });
  }
});


router.patch("/:id/players", requireAdmin, async (req, res) => {
  try {
    const { playerId } = req.body;

    if (!mongoose.isValidObjectId(req.params.id) ||
      !mongoose.isValidObjectId(playerId)) {
      return res.status(400).json({
        message: "Invalid auction set or player ID"
      });
    }

    const auctionSet = await AuctionSet.findById(req.params.id);

    if (!auctionSet) {
      return res.status(404).json({
        message: "Auction set not found"
      });
    }

    if (auctionSet.status !== "UPCOMING") {
      return res.status(400).json({
        message: "Players can only be added to UPCOMING sets"
      });
    }

    const player = await Player.findById(playerId);

    if (!player) {
      return res.status(404).json({
        message: "Player not found"
      });
    }

    if (player.role !== auctionSet.role) {
      return res.status(400).json({
        message: "Player role does not match auction set role"
      });
    }

    const existingAssignment = await AuctionSet.findOne({
      players: player._id
    });

    if (existingAssignment) {
      return res.status(409).json({
        message: "Player already belongs to an auction set"
      });
    }

    const existingAuction = await Auction.findOne({
      playerId: player._id
    });

    if (existingAuction) {
      return res.status(409).json({
        message: "Player already has an auction record"
      });
    }

    auctionSet.players.push(player._id);
    await auctionSet.save();

    return res.status(200).json({
      message: "Player assigned successfully",
      data: auctionSet
    });
  } catch (error) {
    console.error("Failed to assign player:", error);

    return res.status(500).json({
      message: "Failed to assign player"
    });
  }
});


module.exports = router;
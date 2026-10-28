const express = require("express");
const Auction = require("../models/auction");
const Player = require("../models/player");
const AuctionSet = require("../models/auctionSet");
const mongoose = require("mongoose");
const Team = require("../models/team");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { playerId, setNumber } = req.body;

    if (!playerId || setNumber === undefined) {
      return res.status(400).json({
        message: "playerId and setNumber are required"
      });
    }

    const player = await Player.findById(playerId);

    if (!player) {
      return res.status(404).json({
        message: "Player not found"
      });
    }

    const auctionSet = await AuctionSet.findOne({
  setNumber
});

if (!auctionSet) {
  return res.status(404).json({
    message: "Auction set not found"
  });
}

if (auctionSet.status !== "IN_PROGRESS") {
  return res.status(400).json({
    message: "Auction set must be IN_PROGRESS"
  });
}

const isPlayerInSet = auctionSet.players.some(
  (id) => id.toString() === playerId.toString()
);

if (!isPlayerInSet) {
  return res.status(400).json({
    message: "Player does not belong to this auction set"
  });
}

    const existingAuction = await Auction.findOne({ playerId });

    if (existingAuction) {
      return res.status(409).json({
        message: "Player is already added to the auction"
      });
    }

    const auction = await Auction.create({
      playerId: player._id,
      setNumber,
      basePrice: player.basePrice
    });

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

router.post("/:auctionId/bids", async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { teamId, amount } = req.body;
    if (!mongoose.isValidObjectId(auctionId)) {
  return res.status(400).json({
    message: "Invalid auction ID"
  });
}

    if (!teamId || amount === undefined) {
      return res.status(400).json({
        message: "teamId and amount are required"
      });
    }

    if (
  typeof amount !== "number" ||
  !Number.isFinite(amount) ||
  amount <= 0
) {
  return res.status(400).json({
    message: "Bid amount must be a valid positive number"
  });
}

if (!mongoose.isValidObjectId(teamId)) {
  return res.status(400).json({
    message: "Invalid team ID"
  });
}

const team = await Team.findById(teamId);

if (!team) {
  return res.status(404).json({
    message: "Team not found"
  });
}

    const auction = await Auction.findById(auctionId);

    if (!auction) {
      return res.status(404).json({
        message: "Auction not found"
      });
    }

    if (auction.status !== "LIVE") {
      return res.status(400).json({
        message: "Bids are only allowed for a live auction"
      });
    }

    if (auction.bids.length === 0) {
      if (amount < auction.basePrice) {
        return res.status(400).json({
          message: "First bid cannot be lower than the base price"
        });
      }
    } else {
      const lastBid = auction.bids[auction.bids.length - 1];

      if (amount <= lastBid.amount) {
        return res.status(400).json({
          message: "Bid must be higher than the current bid"
        });
      }

      if (lastBid.teamId.toString() === teamId) {
        return res.status(400).json({
          message: "Current highest bidder cannot bid again"
        });
      }
    }

    auction.bids.push({
      teamId,
      amount
    });

    await auction.save();

    return res.status(201).json({
      message: "Bid placed successfully",
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

router.patch("/:auctionId/start", async (req, res) => {
  try {
    const { auctionId } = req.params;

    const auction = await Auction.findById(auctionId);

    if (!auction) {
      return res.status(404).json({
        message: "Auction not found"
      });
    }

    if (auction.status !== "UPCOMING") {
      return res.status(400).json({
        message: "Only an upcoming auction can be started"
      });
    }

    const auctionSet = await AuctionSet.findOne({
      setNumber: auction.setNumber
    });

    if (!auctionSet) {
      return res.status(404).json({
        message: "Auction set not found"
      });
    }

    if (auctionSet.status !== "IN_PROGRESS") {
      return res.status(400).json({
        message: "Auction set must be IN_PROGRESS to start an auction"
      });
    }

    const isPlayerInSet = auctionSet.players.some(
      (playerId) => playerId.toString() === auction.playerId.toString()
    );

    if (!isPlayerInSet) {
      return res.status(400).json({
        message: "Player does not belong to this auction set"
      });
    }

    const activeAuction = await Auction.findOne({
      status: "LIVE"
    });

    if (activeAuction) {
      return res.status(409).json({
        message: "Another auction is already LIVE"
      });
    }

    auction.status = "LIVE";
    await auction.save();

    return res.json({
      message: "Auction started successfully",
      data: auction
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Another auction is already LIVE"
      });
    }

    return res.status(500).json({
      message: error.message
    });
  }
});

router.patch("/:auctionId/sold", async (req, res) => {
  try {
    const { auctionId } = req.params;

    const auction = await Auction.findById(auctionId);

    if (!auction) {
      return res.status(404).json({
        message: "Auction not found"
      });
    }

    if (auction.status !== "LIVE") {
      return res.status(400).json({
        message: "Only a live auction can be marked as sold"
      });
    }

    if (auction.bids.length === 0) {
      return res.status(400).json({
        message: "Cannot mark auction as sold without any bids"
      });
    }

    const winningBid = auction.bids[auction.bids.length - 1];

    auction.teamId = winningBid.teamId;
    auction.finalPrice = winningBid.amount;
    auction.status = "SOLD";

    await auction.save();

    const updatedPlayer = await Player.findByIdAndUpdate(
      auction.playerId,
      {
        teamId: winningBid.teamId
      },
      { new: true }
    );

    if (!updatedPlayer) {
      throw new Error("Player not found while assigning winning team");
    }

    return res.json({
      message: "Player sold successfully",
      data: auction
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

router.patch("/:auctionId/unsold", async (req, res) => {
  try {
    const { auctionId } = req.params;

    const auction = await Auction.findById(auctionId);

    if (!auction) {
      return res.status(404).json({
        message: "Auction not found"
      });
    }

    if (auction.status !== "LIVE") {
      return res.status(400).json({
        message: "Only a live auction can be marked as unsold"
      });
    }

    if (auction.bids.length > 0) {
      return res.status(400).json({
        message: "Cannot mark auction as unsold when bids exist"
      });
    }

    auction.status = "UNSOLD";
    await auction.save();

    return res.json({
      message: "Player marked as unsold successfully",
      data: auction
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
});

module.exports = router;
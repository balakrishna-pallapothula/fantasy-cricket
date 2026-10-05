const express = require("express");
const Auction = require("../models/auction");
const Player = require("../models/player");

const router = express.Router();

router.post("/:auctionId/bids", async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { teamId, amount } = req.body;
    if (!teamId || amount === undefined) {
      return res.status(400).json({
        message: "teamId and amount are required"
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

    auction.status = "LIVE";
    await auction.save();

    return res.json({
      message: "Auction started successfully",
      data: auction
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});


module.exports = router;
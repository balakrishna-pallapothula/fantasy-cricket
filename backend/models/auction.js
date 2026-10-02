const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team"
    },
    basePrice: {
      type: Number,
      required: true
    },
    finalPrice: {
      type: Number
    },
    bidAmount: {
      type: Number
    },
    status: {
      type: String,
      enum: ["SOLD", "UNSOLD"],
      default: "UNSOLD"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Auction", auctionSchema);

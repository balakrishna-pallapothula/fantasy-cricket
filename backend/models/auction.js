const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true
    },
    setNumber: {
      type: Number,
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
    bids: [
      {
        teamId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Team",
          required: true
        },
        amount: {
          type: Number,
          required: true
        }
      }
    ],
    status: {
      type: String,
      enum: ["UPCOMING", "LIVE", "SOLD", "UNSOLD"],
      default: "UPCOMING"
    }
  },
  { timestamps: true }
);

auctionSchema.index(
  { status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "LIVE" }
  }
);

module.exports = mongoose.model("Auction", auctionSchema);

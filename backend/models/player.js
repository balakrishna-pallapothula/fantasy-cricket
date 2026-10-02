const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    role: {
      type: String,
      required: true,
      enum: ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"]
    },

    country: { type: String, required: true },

    basePrice: { type: Number, required: true },

    matches: { type: Number, default: 0 },

    runs: { type: Number, default: 0 },

    battingAverage: { type: Number, default: 0 },

    highestScore: { type: Number, default: 0 },

    wickets: { type: Number, default: 0 },

    bowlingAverage: { type: Number, default: 0 },

    economy: { type: Number, default: 0 },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Player", playerSchema);

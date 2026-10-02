// models/playerHistory.js
const mongoose = require("mongoose");

const playHistorySchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    soldPrice: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

playHistorySchema.index(
  { playerId: 1, teamId: 1, year: 1 },
  { unique: true }
);

module.exports = mongoose.model("PlayerHistory", playHistorySchema);

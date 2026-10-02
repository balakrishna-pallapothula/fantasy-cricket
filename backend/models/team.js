// models/team.js
const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    franchise: {
      type: String,
      required: true
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player",
        required: true
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", teamSchema);

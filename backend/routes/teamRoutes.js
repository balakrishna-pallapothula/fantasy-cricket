const express = require("express");
const Team = require("../models/team");
const Player = require("../models/player");
const Auction = require("../models/auction");

const router = express.Router();

router.post("/", async (req, res) => {
  const team = await Team.create(req.body);
  res.status(201).json(team);
});

router.get("/", async (req, res) => {
  try {
    const teams = await Team.find();
    const soldAuctions = await Auction.find({
      status: "SOLD"
    });
    const players = await Player.find();

    const teamsWithPlayers = teams.map((team) => {
      const teamPlayers = players
        .filter(
          (player) =>
            player.teamId?.toString() === team._id.toString()
        )
        .map((player) => {
          const auction = soldAuctions.find(
            (auction) =>
              auction.playerId.toString() === player._id.toString()
          );

          return {
            ...player.toObject(),
            finalPrice: auction?.finalPrice ?? null
          };
        });

      return {
        ...team.toObject(),
        players: teamPlayers
      };
    });

    res.json(teamsWithPlayers);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

module.exports = router;

const Player = require("../models/player");

exports.createPlayer = async (req, res) => {
  try {
    const player = await Player.create(req.body);
    res.status(201).json(player);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getPlayers = async (req, res) => {
  try {
    const players = await Player.find().populate("teamId", "name franchise");
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const express = require("express");
const Team = require("../models/team");

const router = express.Router();

router.post("/", async (req, res) => {
  const team = await Team.create(req.body);
  res.status(201).json(team);
});

router.get("/", async (req, res) => {
  const teams = await Team.find().populate("players");
  res.json(teams);
});

module.exports = router;

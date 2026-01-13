const express = require("express");
require('dotenv').config();
const connectDB = require("./db");
const app = express();
const Player = require("./models/player");


app.use(express.json());
connectDB(); //  MongoDB connects here

// let players = []; //  shared storage

// let idCounter = 1;

app.post("/api/players", async (req, res) => {
  try {
    const { name, role } = req.body;

    if (!name || !role) {
      return res.status(400).json({ message: "Name and role are required" });
    }

    const player = await Player.create({ name, role });

    res.status(201).json({
      message: "Player created successfully",
      data: player
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


app.get("/api/players", async (req, res) => {
  try {
    const players = await Player.find();
    res.json(players);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


app.put("/api/players/:id", async (req, res) => {
  try {
    const player = await Player.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.json({
      message: "Player updated successfully",
      data: player
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});


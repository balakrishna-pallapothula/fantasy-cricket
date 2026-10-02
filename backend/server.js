// const express = require("express");
// require('dotenv').config();
// const connectDB = require("./db");
// const app = express();
// const Player = require("./models/player");


// app.use(express.json());
// connectDB(); //  MongoDB connects here

// // let players = []; //  shared storage

// // let idCounter = 1;

// app.post("/api/players", async (req, res) => {
//   try {
//     const { name, role } = req.body;

//     if (!name || !role) {
//       return res.status(400).json({ message: "Name and role are required" });
//     }

//     const player = await Player.create({ name, role });

//     res.status(201).json({
//       message: "Player created successfully",
//       data: player
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });


// app.get("/api/players", async (req, res) => {
//   try {
//     const players = await Player.find();
//     res.json(players);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });


// app.put("/api/players/:id", async (req, res) => {
//   try {
//     const { name, role } = req.body;

//     const updatedPlayer = await Player.findByIdAndUpdate(
//       req.params.id,
//       { name, role },
//       { new: true }
//     );

//     if (!updatedPlayer) {
//       return res.status(404).json({ message: "Player not found" });
//     }

//     res.json({
//       message: "Player updated successfully",
//       data: updatedPlayer
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });


// app.delete("/api/players/:id", async (req, res) => {
//   try {
//     const deletedPlayer = await Player.findByIdAndDelete(req.params.id);

//     if (!deletedPlayer) {
//       return res.status(404).json({ message: "Player not found" });
//     }

//     res.json({ message: "Player deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// app.listen(5000, () => {
//   console.log("Server running on port 5000");
// });
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./db");

const playerRoutes = require("./routes/playerRoutes");
const teamRoutes = require("./routes/teamRoutes");
const playerProfileRoutes = require("./routes/playerProfileRoutes");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/players", playerRoutes);
app.use("/api/players", playerProfileRoutes);
app.use("/api/teams", teamRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));



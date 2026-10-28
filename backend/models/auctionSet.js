const mongoose = require('mongoose');

const auctionSetSchema = new mongoose.Schema(
  {
    setNumber: {
      type: Number,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: [
        'Batsman',
        'Bowler',
        'All-Rounder',
        'Wicket-Keeper'
      ],
      required: true
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      }
    ],
    status: {
      type: String,
      enum: ['UPCOMING', 'IN_PROGRESS', 'COMPLETED'],
      default: 'UPCOMING'
    }
  },
  { timestamps: true }
);

auctionSetSchema.index(
  { status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: 'IN_PROGRESS'
    }
  }
);

module.exports = mongoose.model('AuctionSet', auctionSetSchema);
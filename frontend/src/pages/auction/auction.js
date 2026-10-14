import './auction.scss';

import {
  getPlayers,
  getTeams,
  getAuctions,
  createAuction,
  startAuction,
  placeBid,
  markAuctionSold,
} from '../../api';

const app = document.getElementById('app');
const currentPlayer = document.querySelector('#current-player');

let players = [];
let teams = [];
let selectedPlayer = null;
let currentAuction = null;
let auctions = [];

async function loadPlayers() {
  app.innerHTML = '<p>Loading players...</p>';

  try {
    players = await getPlayers();
    renderPlayers();
  } catch (error) {
    app.innerHTML = '<p>Error loading players</p>';
    console.error('Error loading players:', error);
  }
}

async function loadTeams() {
  try {
    teams = await getTeams();
    console.log('Teams:', teams);
  } catch (error) {
    console.error('Error loading teams:', error);
  }
}

async function loadAuctions() {
  try {
    auctions = await getAuctions();
    console.log('Existing auctions:', auctions);
  } catch (error) {
    console.error('Error loading auctions:', error);
  }
}

function renderPlayers() {
  app.innerHTML = players
    .map(
      player => `
        <div class="card">
          <h3>${player.name}</h3>
          <p>Role: ${player.role}</p>
          <p>Country: ${player.country}</p>
          <strong>Base Price: ₹ ${player.basePrice}</strong>

          <button
            class="card__select"
            data-player-id="${player._id}"
          >
            Select Player
          </button>
        </div>
      `
    )
    .join('');

  const selectButtons = document.querySelectorAll('.card__select');

  selectButtons.forEach(button => {
    button.addEventListener('click', () => {
      const playerId = button.dataset.playerId;

      selectedPlayer = players.find(
        player => player._id === playerId
      );

      currentAuction = auctions.find(
        auction => auction.playerId._id === selectedPlayer._id
      ) || null;

      console.log('Selected player auction:', currentAuction);

      renderSelectedPlayer();
    });
  });
}

function renderSelectedPlayer() {
  if (!selectedPlayer) {
    currentPlayer.innerHTML = '<p>No player selected</p>';
    return;
  }

  currentPlayer.innerHTML = `
    <h3>${selectedPlayer.name}</h3>
    <p>Role: ${selectedPlayer.role}</p>
    <p>Country: ${selectedPlayer.country}</p>
    <strong>Base Price: ₹ ${selectedPlayer.basePrice}</strong>

    ${!currentAuction || currentAuction.status === 'UPCOMING'
      ? '<button id="start-auction">Start Auction</button>'
      : `<p>Auction Status: ${currentAuction.status}</p>`
    }

    <div id="current-bid"></div>
    <div id="bidding-controls"></div>
  `;

  const startAuctionButton = document.querySelector('#start-auction');

  startAuctionButton?.addEventListener('click', async () => {
    startAuctionButton.disabled = true;

    try {
      let auctionId;

      if (currentAuction?.status === 'UPCOMING') {
        auctionId = currentAuction._id;
      } else {
        const auctionResponse = await createAuction(
          selectedPlayer._id,
          1
        );

        auctionId = auctionResponse.data._id;
      }

      const startResponse = await startAuction(auctionId);

      currentAuction = startResponse.data;

      const auctionIndex = auctions.findIndex(
        auction => auction._id === currentAuction._id
      );

      if (auctionIndex !== -1) {
        auctions[auctionIndex] = currentAuction;
      } else {
        auctions.push(currentAuction);
      }

      console.log('Auction started:', currentAuction);

      renderSelectedPlayer();
    } catch (error) {
      startAuctionButton.disabled = false;
      console.error('Error starting auction:', error);
    }
  });

  if (currentAuction?.status === 'LIVE') {
    renderCurrentBid();
    renderBiddingControls();

    if (currentAuction.bids.length > 0) {
      const soldButton = document.createElement('button');

      soldButton.id = 'mark-sold';
      soldButton.textContent = 'Mark as SOLD';

      document.querySelector('#bidding-controls').append(soldButton);
      soldButton.addEventListener('click', async () => {
        soldButton.disabled = true;

        try {
          const response = await markAuctionSold(currentAuction._id);

          currentAuction = response.data;

          const auctionIndex = auctions.findIndex(
            auction => auction._id === currentAuction._id
          );

          if (auctionIndex !== -1) {
            auctions[auctionIndex] = currentAuction;
          }

          renderSelectedPlayer();
        } catch (error) {
          soldButton.disabled = false;
          console.error('Error marking auction as sold:', error);
        }
      });
    }
  }

  if (currentAuction?.status === 'SOLD') {
    const winningTeam = teams.find(
      team => team._id === currentAuction.teamId
    );

    document.querySelector('#current-bid').innerHTML = `
      <p>Final Price: ₹ ${currentAuction.finalPrice}</p>
      <p>Winning Team: ${winningTeam?.name || 'Unknown Team'}</p>
    `;
  }
}

function renderBiddingControls() {
  const biddingControls = document.querySelector(
    '#bidding-controls'
  );

  biddingControls.innerHTML = `
    <select id="bid-team">
      <option value="">Select Team</option>

      ${teams
      .map(
        team => `
            <option value="${team._id}">
              ${team.name}
            </option>
          `
      )
      .join('')}
    </select>

    <input
      id="bid-amount"
      type="number"
      placeholder="Bid amount"
    />

    <button id="place-bid">
      Place Bid
    </button>
  `;


  const placeBidButton = document.querySelector('#place-bid');

  placeBidButton.addEventListener('click', async () => {
    const teamId = document.querySelector('#bid-team').value;
    const amount = Number(
      document.querySelector('#bid-amount').value
    );

    if (!teamId || !amount) {
      console.error('Team and bid amount are required');
      return;
    }

    try {
      const response = await placeBid(
        currentAuction._id,
        teamId,
        amount
      );

      currentAuction = response.data;

      renderSelectedPlayer();

      console.log('Bid placed:', currentAuction);
    } catch (error) {
      console.error('Error placing bid:', error);
    }
  });
}

function renderCurrentBid() {
  const currentBidElement = document.querySelector('#current-bid');

  if (!currentAuction || currentAuction.bids.length === 0) {
    currentBidElement.innerHTML = '<p>No bids yet</p>';
    return;
  }

  const latestBid =
    currentAuction.bids[currentAuction.bids.length - 1];

  const biddingTeam = teams.find(
    team => team._id === latestBid.teamId
  );

  currentBidElement.innerHTML = `
    <p>Current Bid: ₹ ${latestBid.amount}</p>
    <p>
      Highest Bidder:
      ${biddingTeam ? biddingTeam.name : 'Unknown Team'}
    </p>
  `;
}


async function initializeAuctionPage() {
  await Promise.all([
    loadTeams(),
    loadAuctions()
  ]);

  await loadPlayers();
}

initializeAuctionPage();



import '../../styles/global.scss';
import './auction.scss';

import { renderHeader } from '../../components/header/header';
import { renderFooter } from '../../components/footer/footer';

import {
  getPlayers,
  getTeams,
  getAuctions,
  getAuctionSets,
  createAuction,
  startAuction,
  placeBid,
  markAuctionSold,
  markAuctionUnsold,
} from '../../api';

const headerRoot = document.querySelector('#header');
const footerRoot = document.querySelector('#footer');

if (headerRoot) renderHeader(headerRoot);
if (footerRoot) renderFooter(footerRoot);

const app = document.getElementById('app');
const currentPlayer = document.getElementById('current-player');

let players = [];
let teams = [];
let auctions = [];
let auctionSets = [];
let selectedPlayer = null;
let currentAuction = null;

// Handle both populated MongoDB references and plain IDs.
const getId = value => String(value?._id ?? value ?? '');

const formatPrice = amount => {
  const price = Number(amount);

  if (price >= 10000000) {
    return `₹${parseFloat((price / 10000000).toFixed(2))} Cr`;
  }

  if (price >= 100000) {
    return `₹${parseFloat((price / 100000).toFixed(2))} L`;
  }

  return `₹${price.toLocaleString('en-IN')}`;
};

// Find the auction set currently in progress.
const getActiveSet = () =>
  auctionSets.find(set => set.status === 'IN_PROGRESS');

// Check whether the selected player belongs to that set.
const playerBelongsToSet = (player, set) =>
  set?.players?.some(setPlayer => getId(setPlayer) === getId(player));

async function loadPlayers() {
  app.innerHTML = '<p>Loading players...</p>';

  try {
    players = await getPlayers();
    renderPlayers();
  } catch (error) {
    app.textContent = 'Error loading players';
    console.error('Error loading players:', error);
  }
}

async function loadTeams() {
  try {
    teams = await getTeams();
  } catch (error) {
    console.error('Error loading teams:', error);
  }
}

async function loadAuctions() {
  try {
    auctions = await getAuctions();
  } catch (error) {
    console.error('Error loading auctions:', error);
  }
}

async function loadAuctionSets() {
  try {
    auctionSets = await getAuctionSets();
  } catch (error) {
    console.error('Error loading auction sets:', error);
  }
}

// Keep the local auction list updated after an API action.
function updateAuction(updatedAuction) {
  currentAuction = updatedAuction;

  const index = auctions.findIndex(auction =>
    getId(auction) === getId(updatedAuction)
  );

  if (index === -1) {
    auctions.push(updatedAuction);
  } else {
    auctions[index] = updatedAuction;
  }
}

function renderPlayers() {
  app.innerHTML = players
    .map(player => `
      <div class="card">
        <h3>${player.name}</h3>
        <p>Role: ${player.role}</p>
        <p>Country: ${player.country}</p>
        <strong>Base Price: ${formatPrice(player.basePrice)}</strong>

        <button
          class="card__select"
          data-player-id="${player._id}"
        >
          Select Player
        </button>
      </div>
    `)
    .join('');

  app.querySelectorAll('.card__select').forEach(button => {
    button.addEventListener('click', () => {
      selectedPlayer = players.find(player =>
        getId(player) === button.dataset.playerId
      );

      currentAuction = auctions.find(auction =>
        getId(auction.playerId) === getId(selectedPlayer)
      ) || null;

      renderSelectedPlayer();
    });
  });
}

function renderSelectedPlayer() {
  if (!selectedPlayer) {
    currentPlayer.innerHTML = '<p>No player selected</p>';
    return;
  }

  const activeSet = getActiveSet();

  const canStart =
    !currentAuction || currentAuction.status === 'UPCOMING';

  const belongsToActiveSet =
    playerBelongsToSet(selectedPlayer, activeSet);

  const canStartInSet =
    activeSet &&
    belongsToActiveSet &&
    (
      !currentAuction ||
      Number(currentAuction.setNumber) === Number(activeSet.setNumber)
    );

  currentPlayer.innerHTML = `
    <h3>${selectedPlayer.name}</h3>
    <p>Role: ${selectedPlayer.role}</p>
    <p>Country: ${selectedPlayer.country}</p>
    <strong>Base Price: ${formatPrice(selectedPlayer.basePrice)}</strong>

    ${canStart
      ? canStartInSet
        ? '<button id="start-auction" class="auction__start-button">Start Auction</button>'
        : '<p>Start the auction set containing this player in the Admin Dashboard first.</p>'
      : `<p>Auction Status: ${currentAuction.status}</p>`
    }

    <div id="current-bid"></div>
    <div id="bidding-controls"></div>
  `;

  const startAuctionButton =
    currentPlayer.querySelector('#start-auction');

  startAuctionButton?.addEventListener('click', async () => {
    startAuctionButton.disabled = true;

    try {
      let auctionId;

      if (currentAuction?.status === 'UPCOMING') {
        auctionId = currentAuction._id;
      } else {
        const auctionResponse = await createAuction(
          selectedPlayer._id,
          activeSet.setNumber
        );

        auctionId = auctionResponse.data._id;
      }

      const startResponse = await startAuction(auctionId);

      updateAuction(startResponse.data);
      renderSelectedPlayer();
    } catch (error) {
      startAuctionButton.disabled = false;
      console.error('Error starting auction:', error);
      alert(error.message);
    }
  });

  if (currentAuction?.status === 'LIVE') {
    renderCurrentBid();
    renderBiddingControls();

    if (currentAuction.bids?.length > 0) {
      const soldButton = document.createElement('button');

      soldButton.id = 'mark-sold';
      soldButton.textContent = 'Mark as SOLD';

      currentPlayer
        .querySelector('#bidding-controls')
        .append(soldButton);

      soldButton.addEventListener('click', async () => {
        soldButton.disabled = true;

        try {
          const response = await markAuctionSold(currentAuction._id);

          updateAuction(response.data);
          renderSelectedPlayer();
        } catch (error) {
          soldButton.disabled = false;
          console.error('Error marking auction as sold:', error);
          alert(error.message);
        }
      });
    } else {
      const unsoldButton = document.createElement('button');

      unsoldButton.id = 'mark-unsold';
      unsoldButton.textContent = 'Mark as UNSOLD';

      currentPlayer
        .querySelector('#bidding-controls')
        .append(unsoldButton);

      unsoldButton.addEventListener('click', async () => {
        unsoldButton.disabled = true;

        try {
          const response = await markAuctionUnsold(currentAuction._id);

          updateAuction(response.data);
          renderSelectedPlayer();
        } catch (error) {
          unsoldButton.disabled = false;
          console.error('Error marking auction as unsold:', error);
          alert(error.message);
        }
      });
    }
  }

  if (currentAuction?.status === 'SOLD') {
    const winningTeam = teams.find(team =>
      getId(team) === getId(currentAuction.teamId)
    );

    currentPlayer.querySelector('#current-bid').innerHTML = `
      <p>Final Price: ${formatPrice(currentAuction.finalPrice)}</p>
      <p>Winning Team: ${winningTeam?.name || 'Unknown Team'}</p>
    `;
  }
}

function renderBiddingControls() {
  const biddingControls =
    currentPlayer.querySelector('#bidding-controls');

  biddingControls.innerHTML = `
    <select id="bid-team">
      <option value="">Select Team</option>

      ${teams
      .map(team => `
          <option value="${team._id}">
            ${team.name}
          </option>
        `)
      .join('')}
    </select>

    <input
      id="bid-amount"
      type="number"
      min="1"
      placeholder="Bid amount"
    />

    <button id="place-bid">
      Place Bid
    </button>
  `;

  const placeBidButton =
    biddingControls.querySelector('#place-bid');

  placeBidButton.addEventListener('click', async () => {
    const teamId =
      biddingControls.querySelector('#bid-team').value;

    const amount = Number(
      biddingControls.querySelector('#bid-amount').value
    );

    if (!teamId || !Number.isFinite(amount) || amount <= 0) {
      alert('Select a team and enter a valid bid amount.');
      return;
    }

    placeBidButton.disabled = true;

    try {
      const response = await placeBid(
        currentAuction._id,
        teamId,
        amount
      );

      updateAuction(response.data);
      renderSelectedPlayer();
    } catch (error) {
      placeBidButton.disabled = false;
      console.error('Error placing bid:', error);
      alert(error.message);
    }
  });
}

function renderCurrentBid() {
  const currentBidElement =
    currentPlayer.querySelector('#current-bid');

  if (!currentAuction?.bids?.length) {
    currentBidElement.innerHTML = '<p>No bids yet</p>';
    return;
  }

  const latestBid = currentAuction.bids.at(-1);

  const biddingTeam = teams.find(team =>
    getId(team) === getId(latestBid.teamId)
  );

  currentBidElement.innerHTML = `
    <p>Current Bid: ${formatPrice(latestBid.amount)}</p>
    <p>Highest Bidder: ${biddingTeam?.name || 'Unknown Team'}</p>
  `;
}

async function initializeAuctionPage() {
  await Promise.all([
    loadTeams(),
    loadAuctions(),
    loadAuctionSets(),
  ]);

  await loadPlayers();
}

initializeAuctionPage();


import '../../styles/global.scss';
import './admin.scss';

import { renderHeader } from '../../components/header/header';
import { renderFooter } from '../../components/footer/footer';

import {
  getAuctions,
  getPlayers,
  getTeams,
  getAuctionSets,
  assignPlayerToSet,
  createAuctionSet,
  startAuctionSet,
  createAuction,
  startAuction,
  placeBid,
  markAuctionSold,
  markAuctionUnsold,
  completeAuctionSet,
  loginAdmin,
  getAdminSession,
  logoutAdmin,
} from '../../api';

const headerRoot = document.querySelector('#header');
const footerRoot = document.querySelector('#footer');
const loginSection = document.getElementById('admin-login');
const loginForm = document.getElementById('admin-login-form');
const loginError = document.getElementById('admin-login-error');
const dashboard = document.getElementById('admin-dashboard');
const logoutButton = document.getElementById('admin-logout-btn');
const showDashboard = () => {
  loginSection.hidden = true;
  dashboard.hidden = false;
  loadAuctions();
};

if (headerRoot) renderHeader(headerRoot);
if (footerRoot) renderFooter(footerRoot);

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value;

  loginError.textContent = '';

  try {
    await loginAdmin(email, password);
    showDashboard();
  } catch (error) {
    loginError.textContent = error.message;
  }
});

logoutButton.addEventListener('click', async () => {
  logoutButton.disabled = true;

  try {
    await logoutAdmin();

    dashboard.hidden = true;
    loginSection.hidden = false;

    loginForm.reset();
    loginError.textContent = '';
  } catch (error) {
    console.error('Logout failed:', error);
    alert('Unable to log out. Please try again.');
  } finally {
    logoutButton.disabled = false;
  }
});

const initializeAdmin = async () => {
  try {
    await getAdminSession();
    showDashboard();
  } catch (error) {
    loginSection.hidden = false;
    dashboard.hidden = true;
  }
};

const formatCurrency = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN')}`;

const formatStatus = (status) =>
  status.replaceAll('_', ' ');

const getPlayerId = (player) =>
  String(player?._id || player);

const getAuctionForPlayer = (auctions, playerId) =>
  auctions.find(
    (auction) =>
      getPlayerId(auction.playerId) === String(playerId)
  );

const createButton = (text, className, onClick) => {
  const button = document.createElement('button');

  button.type = 'button';
  button.textContent = text;
  button.className = className;

  button.addEventListener('click', async () => {
    try {
      button.disabled = true;
      await onClick();
      await loadAuctions();
    } catch (error) {
      alert(error.message);
      button.disabled = false;
    }
  });

  return button;
};

// ---------------------------------------
// Unassigned Registered Players
// ---------------------------------------

function renderRegisteredPlayers(
  players,
  auctionSets,
  auctions
) {
  const container =
    document.getElementById('registered-players');

  if (!container) return;

  container.replaceChildren();

  const auctionedIds = new Set(
    auctions.map((auction) =>
      getPlayerId(auction.playerId)
    )
  );

  const assignedIds = new Set(
    auctionSets.flatMap((set) =>
      set.players.map(getPlayerId)
    )
  );

  const eligiblePlayers = players.filter(
    (player) =>
      !auctionedIds.has(String(player._id)) &&
      !assignedIds.has(String(player._id))
  );

  if (eligiblePlayers.length === 0) {
    container.innerHTML = `
      <p class="admin__empty">
        No unassigned players available.
      </p>
    `;
    return;
  }

  eligiblePlayers.forEach((player) => {
    const card = document.createElement('div');
    card.className = 'registered-player';

    const info = document.createElement('div');
    info.className = 'registered-player__info';

    const name = document.createElement('h3');
    name.textContent = player.name;

    const details = document.createElement('p');
    details.textContent =
      `${player.role} · Base Price: ${formatCurrency(player.basePrice)}`;

    info.append(name, details);

    const availableSets = auctionSets.filter(
      (set) =>
        set.status === 'UPCOMING' &&
        set.role === player.role
    );

    if (availableSets.length === 0) {
      const message = document.createElement('p');
      message.className = 'admin__empty';
      message.textContent =
        'No UPCOMING auction set available for this role.';

      card.append(info, message);
    } else {
      const actions = document.createElement('div');
      actions.className = 'registered-player__actions';

      const select = document.createElement('select');
      select.setAttribute(
        'aria-label',
        `Select auction set for ${player.name}`
      );

      const defaultOption =
        document.createElement('option');

      defaultOption.value = '';
      defaultOption.textContent = 'Select Auction Set';
      select.appendChild(defaultOption);

      availableSets.forEach((set) => {
        const option = document.createElement('option');
        option.value = set._id;
        option.textContent = set.name;
        select.appendChild(option);
      });

      const assignButton = createButton(
        'Assign to Set',
        'admin__button',
        async () => {
          if (!select.value) {
            throw new Error(
              'Please select an auction set'
            );
          }

          await assignPlayerToSet(
            select.value,
            player._id
          );
        }
      );

      actions.append(select, assignButton);
      card.append(info, actions);
    }

    container.appendChild(card);
  });
}

// ---------------------------------------
// Auction Sets
// ---------------------------------------

function renderAuctionSets(auctionSets, auctions) {
  const container =
    document.getElementById('player-sets');

  if (!container) return;

  container.replaceChildren();

  if (auctionSets.length === 0) {
    container.innerHTML = `
      <p class="admin__empty">
        No auction sets created yet.
      </p>
    `;
    return;
  }

  const hasActiveSet = auctionSets.some(
    (set) => set.status === 'IN_PROGRESS'
  );

  auctionSets.forEach((set) => {
    const section = document.createElement('section');
    section.className = 'auction-set';

    // Header
    const header = document.createElement('div');
    header.className = 'auction-set__header';

    const headingGroup = document.createElement('div');

    const heading = document.createElement('h3');
    heading.textContent = set.name;

    const count = document.createElement('p');
    count.textContent =
      `${set.players.length} ${set.players.length === 1 ? 'player' : 'players'
      }`;

    headingGroup.append(heading, count);

    const status = document.createElement('span');
    status.className = `
      auction-set__status
      auction-set__status--${set.status
        .toLowerCase()
        .replaceAll('_', '-')}
    `;

    status.textContent = formatStatus(set.status);

    header.append(headingGroup, status);
    section.appendChild(header);

    // Player list
    const list = document.createElement('ul');
    list.className = 'auction-set__list';

    if (set.players.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'admin__empty';
      emptyItem.textContent = 'No players assigned.';
      list.appendChild(emptyItem);
    }

    set.players.forEach((player) => {
      const playerAuction = getAuctionForPlayer(
        auctions,
        player._id
      );

      const item = document.createElement('li');
      item.className = 'auction-set__player';

      const playerInfo = document.createElement('div');
      playerInfo.className = 'auction-set__player-info';

      const playerName = document.createElement('strong');
      playerName.className = 'auction-set__player-name';
      playerName.textContent = player.name;

      const role = document.createElement('span');
      role.className = 'auction-set__player-role';
      role.textContent = player.role;

      playerInfo.append(playerName, role);

      const playerStatus = document.createElement('span');
      const auctionStatus =
        playerAuction?.status || 'NOT STARTED';

      playerStatus.className = `
        auction-set__player-status
        auction-set__player-status--${auctionStatus
          .toLowerCase()
          .replaceAll(/[\s_]+/g, '-')}
      `;

      playerStatus.textContent =
        formatStatus(auctionStatus);

      item.append(playerInfo, playerStatus);

      // Create player auction
      if (
        set.status === 'IN_PROGRESS' &&
        !playerAuction
      ) {
        item.appendChild(
          createButton(
            'Create Auction',
            'admin__button',
            () =>
              createAuction(
                player._id,
                set.setNumber
              )
          )
        );
      }

      // Start player auction
      if (
        set.status === 'IN_PROGRESS' &&
        playerAuction?.status === 'UPCOMING'
      ) {
        item.appendChild(
          createButton(
            'Start Auction',
            'admin__button',
            () => startAuction(playerAuction._id)
          )
        );
      }

      list.appendChild(item);
    });

    section.appendChild(list);

    // Set actions
    const actions = document.createElement('div');
    actions.className = 'auction-set__actions';

    const canStart =
      set.status === 'UPCOMING' &&
      set.players.length > 0 &&
      !hasActiveSet;

    if (canStart) {
      actions.appendChild(
        createButton(
          'Start Set',
          'admin__button',
          () => startAuctionSet(set._id)
        )
      );
    }

    const completedPlayerIds = new Set(
      auctions
        .filter(
          (auction) =>
            Number(auction.setNumber) ===
            Number(set.setNumber) &&
            ['SOLD', 'UNSOLD'].includes(
              auction.status
            )
        )
        .map((auction) =>
          getPlayerId(auction.playerId)
        )
    );

    const canComplete =
      set.status === 'IN_PROGRESS' &&
      set.players.length > 0 &&
      set.players.every((player) =>
        completedPlayerIds.has(getPlayerId(player))
      );

    if (canComplete) {
      actions.appendChild(
        createButton(
          'Complete Set',
          'admin__button admin__button--success',
          () => completeAuctionSet(set._id)
        )
      );
    }

    if (actions.childElementCount > 0) {
      section.appendChild(actions);
    }

    container.appendChild(section);
  });
}

// ---------------------------------------
// Current LIVE Auction
// ---------------------------------------

function renderCurrentAuction(auctions, teams) {
  const container = document.getElementById(
    'current-auction-details'
  );

  if (!container) return;

  const liveAuction = auctions.find(
    (auction) => auction.status === 'LIVE'
  );

  if (!liveAuction) {
    container.innerHTML = `
      <p class="admin__empty">
        No LIVE auction currently.
      </p>
    `;
    return;
  }

  const bids = liveAuction.bids || [];
  const highestBid = bids.at(-1);

  const winningTeam = teams.find(
    (team) =>
      String(team._id) ===
      getPlayerId(highestBid?.teamId)
  );

  const minimumBid = highestBid
    ? highestBid.amount + 1
    : liveAuction.basePrice;

  container.innerHTML = `
    <div class="auction-live">
      <div class="auction-live__header">
        <div>
          <h3>${liveAuction.playerId.name}</h3>
          <p>
            ${liveAuction.playerId.role}
            · Set ${liveAuction.setNumber}
          </p>
        </div>

        <span class="auction-live__status">
          LIVE
        </span>
      </div>

      <div class="auction-live__stats">
        <div class="auction-live__stat">
          <span>Base Price</span>
          <strong>
            ${formatCurrency(liveAuction.basePrice)}
          </strong>
        </div>

        <div class="auction-live__stat">
          <span>Highest Bid</span>
          <strong>
            ${highestBid
      ? formatCurrency(highestBid.amount)
      : 'No bids yet'
    }
          </strong>
        </div>

        <div class="auction-live__stat">
          <span>Highest Bidder</span>
          <strong>
            ${highestBid
      ? winningTeam?.name || 'Unknown Team'
      : '—'
    }
          </strong>
        </div>

        <div class="auction-live__stat">
          <span>Total Bids</span>
          <strong>${bids.length}</strong>
        </div>
      </div>

      <div class="auction-live__bid-form">
        <div class="auction-live__field">
          <label for="bid-team">
            Select Team
          </label>

          <select id="bid-team">
            <option value="">Select a team</option>

            ${teams
      .map(
        (team) => `
                  <option value="${team._id}">
                    ${team.name}
                  </option>
                `
      )
      .join('')}
          </select>
        </div>

        <div class="auction-live__field">
          <label for="bid-amount">
            Bid Amount (₹)
          </label>

          <input
            type="number"
            id="bid-amount"
            min="${minimumBid}"
            placeholder="Enter bid amount"
          />
        </div>

        <button
          type="button"
          id="place-bid-btn"
          class="admin__button"
        >
          Place Bid
        </button>
      </div>

      <div class="auction-live__actions">
        ${highestBid
      ? `
              <button
                type="button"
                id="mark-sold-btn"
                class="admin__button admin__button--success"
              >
                Mark as SOLD
              </button>
            `
      : ''
    }

        ${bids.length === 0
      ? `
              <button
                type="button"
                id="mark-unsold-btn"
                class="admin__button admin__button--danger"
              >
                Mark as UNSOLD
              </button>
            `
      : ''
    }
      </div>
    </div>
  `;

  // Place bid
  const placeBidButton =
    document.getElementById('place-bid-btn');

  placeBidButton.addEventListener('click', async () => {
    const teamId =
      document.getElementById('bid-team').value;

    const amountInput =
      document.getElementById('bid-amount');

    const amount = Number(amountInput.value);

    if (
      !teamId ||
      amountInput.value.trim() === '' ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      alert(
        'Please select a team and enter a valid bid amount'
      );
      return;
    }

    try {
      placeBidButton.disabled = true;

      await placeBid(liveAuction._id, teamId, amount);
      await loadAuctions();
    } catch (error) {
      alert(error.message);
      placeBidButton.disabled = false;
    }
  });

  // Mark SOLD
  const soldButton =
    document.getElementById('mark-sold-btn');

  if (soldButton) {
    soldButton.addEventListener('click', async () => {
      try {
        soldButton.disabled = true;

        await markAuctionSold(liveAuction._id);
        await loadAuctions();
      } catch (error) {
        alert(error.message);
        soldButton.disabled = false;
      }
    });
  }

  // Mark UNSOLD
  const unsoldButton =
    document.getElementById('mark-unsold-btn');

  if (unsoldButton) {
    unsoldButton.addEventListener('click', async () => {
      try {
        unsoldButton.disabled = true;

        await markAuctionUnsold(liveAuction._id);
        await loadAuctions();
      } catch (error) {
        alert(error.message);
        unsoldButton.disabled = false;
      }
    });
  }
}

// ---------------------------------------
// Load dashboard
// ---------------------------------------

async function loadAuctions() {
  try {
    const [auctions, players, auctionSets, teams] =
      await Promise.all([
        getAuctions(),
        getPlayers(),
        getAuctionSets(),
        getTeams(),
      ]);

    renderRegisteredPlayers(
      players,
      auctionSets,
      auctions
    );

    renderAuctionSets(auctionSets, auctions);
    renderCurrentAuction(auctions, teams);
  } catch (error) {
    console.error(
      'Failed to load auctions:',
      error.message
    );
  }
}

// ---------------------------------------
// Create auction set
// ---------------------------------------

const createSetForm = document.getElementById(
  'create-auction-set-form'
);

if (createSetForm) {
  createSetForm.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();

      const setNumber = document.getElementById(
        'set-number'
      ).value;

      const setName = document.getElementById(
        'set-name'
      ).value.trim();

      const setRole = document.getElementById(
        'set-role'
      ).value;

      const submitButton = createSetForm.querySelector(
        'button[type="submit"]'
      );

      try {
        submitButton.disabled = true;

        await createAuctionSet(
          setNumber,
          setName,
          setRole
        );

        createSetForm.reset();
        await loadAuctions();

        alert('Auction set created successfully');
      } catch (error) {
        alert(error.message);
      } finally {
        submitButton.disabled = false;
      }
    }
  );
}

initializeAdmin();

import { getAuctions, getPlayers, getTeams, getAuctionSets, markAuctionUnsold, markAuctionSold, startAuctionSet, completeAuctionSet, createAuction, startAuction, placeBid } from '../../api';

const groupPlayersByRole = (players) => {
  return {
    Batsman: players.filter((player) => player.role === 'Batsman'),
    Bowler: players.filter((player) => player.role === 'Bowler'),
    'All-Rounder': players.filter((player) => player.role === 'All-Rounder'),
    'Wicket-Keeper': players.filter((player) => player.role === 'Wicket-Keeper')
  };
};

const loadAuctions = async () => {
  try {
    // 1. Fetch auction and player data
    const auctions = await getAuctions();
    const players = await getPlayers();
    const auctionSets = await getAuctionSets();
    const teams = await getTeams();

    console.log('Available teams:', teams);

    console.log('Saved auction sets:', auctionSets);

    console.log('Registered players:', players);
    console.log('Total registered players:', players.length);

    const playersByRole = groupPlayersByRole(players);

    console.log('Players grouped by role:', playersByRole);

    // 2. Identify players without auction records
    const auctionedPlayerIds = new Set(auctions.map((auction) => auction.playerId._id));

    const eligiblePlayers = players.filter((player) => !auctionedPlayerIds.has(player._id));

    console.log('Eligible players:', eligiblePlayers);
    console.log('Total eligible players:', eligiblePlayers.length);

    // 3. Generate preview sets using all registered players
    // Using 5 temporarily to test multiple sets
    const playerSets = auctionSets;

    console.log('Generated player sets:', playerSets);
    console.log('Total sets:', playerSets.length);

    // 4. Display player sets
    const playerSetsContainer = document.getElementById('player-sets');

    playerSetsContainer.replaceChildren();

    const hasActiveSet = playerSets.some((set) => set.status === 'IN_PROGRESS');

    playerSets.forEach((set, index) => {
      const section = document.createElement('section');
      const heading = document.createElement('h3');
      const list = document.createElement('ul');
      const canStartSet = set.status === 'UPCOMING' && set.players.length > 0 && !hasActiveSet;

      heading.textContent = `${set.name} — ${set.players.length} players — ${set.status}`;

      set.players.forEach((player) => {
        const item = document.createElement('li');
        const playerAuction = auctions.find((auction) => String(auction.playerId?._id || auction.playerId) === String(player._id));
        item.textContent = `${player.name} — ${player.role} — ${playerAuction?.status || 'NOT STARTED'}`;

        if (set.status === 'IN_PROGRESS' && !playerAuction) {
          const createButton = document.createElement('button');

          createButton.textContent = 'Create Auction';
          createButton.className = 'create-auction-btn';

          createButton.addEventListener('click', async () => {
            try {
              createButton.disabled = true;

              await createAuction(player._id, set.setNumber);
              await loadAuctions();
            } catch (error) {
              alert(error.message);
              createButton.disabled = false;
            }
          });

          item.appendChild(createButton);
        }

        if (set.status === 'IN_PROGRESS' && playerAuction?.status === 'UPCOMING') {
          const startButton = document.createElement('button');

          startButton.textContent = 'Start Auction';
          startButton.className = 'start-auction-btn';

          startButton.addEventListener('click', async () => {
            try {
              startButton.disabled = true;
              await startAuction(playerAuction._id);
              await loadAuctions();
            } catch (error) {
              alert(error.message);
              startButton.disabled = false;
            }
          });

          item.appendChild(startButton);
        }

        list.appendChild(item);
      });

      section.append(heading, list);

      if (canStartSet) {
        const startButton = document.createElement('button');

        startButton.textContent = 'Start Set';
        startButton.className = 'start-set-btn';
        startButton.dataset.setId = set._id;

        startButton.addEventListener('click', async () => {
          try {
            startButton.disabled = true;

            await startAuctionSet(startButton.dataset.setId);

            await loadAuctions();
          } catch (error) {
            alert(error.message);
            startButton.disabled = false;
          }
        });

        section.appendChild(startButton);
      }

      const completedPlayerIds = new Set(
        auctions
          .filter((auction) => auction.setNumber === set.setNumber && ['SOLD', 'UNSOLD'].includes(auction.status))
          .map((auction) => auction.playerId._id || auction.playerId)
          .map(String)
      );

      const canCompleteSet = set.status === 'IN_PROGRESS' && set.players.length > 0 && set.players.every((player) => completedPlayerIds.has(String(player._id || player)));

      if (canCompleteSet) {
        const completeButton = document.createElement('button');

        completeButton.textContent = 'Complete Set';
        completeButton.className = 'complete-set-btn';
        completeButton.dataset.setId = set._id;

        completeButton.addEventListener('click', async () => {
          try {
            completeButton.disabled = true;

            await completeAuctionSet(completeButton.dataset.setId);

            await loadAuctions();
          } catch (error) {
            alert(error.message);
            completeButton.disabled = false;
          }
        });

        section.appendChild(completeButton);
      }

      playerSetsContainer.appendChild(section);
    });

    // 5. Find all UPCOMING auctions
    const upcomingAuctions = auctions.filter((auction) => auction.status === 'UPCOMING');

    console.log('Upcoming auctions:', upcomingAuctions);

    // 6. Find the current LIVE auction
    const liveAuction = auctions.find((auction) => auction.status === 'LIVE');

    console.log('Current LIVE auction:', liveAuction);

    // 7. Get the current auction container
    const auctionDetails = document.getElementById('current-auction-details');

    // 8. Handle the case where no auction is LIVE
    if (!liveAuction) {
      auctionDetails.textContent = 'No LIVE auction currently.';
      return;
    }

    // 9. Display current auction details
    const highestBid = liveAuction.bids.at(-1);
    const winningTeam = teams.find((team) => team._id === String(highestBid?.teamId));
    auctionDetails.innerHTML = `
      <h3>${liveAuction.playerId.name}</h3>
      <p>Role: ${liveAuction.playerId.role}</p>
      <p>Set Number: ${liveAuction.setNumber}</p>
      <p>Base Price: ₹${liveAuction.basePrice}</p>
      <p>Status: ${liveAuction.status}</p>
      <p>Total Bids: ${liveAuction.bids.length}</p>
      ${highestBid
        ? `
    <p>Highest Bid: ₹${highestBid.amount}</p>
    <p>Highest Bidder: ${winningTeam?.name || 'Unknown Team'}</p>
  `
        : '<p>No bids placed yet.</p>'
      }
<div>
  <label for="bid-team">Select Team:</label>
  <select id="bid-team">
    <option value="">Select a team</option>
    ${teams
        .map(
          (team) => `
      <option value="${team._id}">${team.name}</option>
    `
        )
        .join('')}
  </select>

  <label for="bid-amount">Bid Amount:</label>
  <input
    type="number"
    id="bid-amount"
    min="${highestBid ? highestBid.amount + 1 : liveAuction.basePrice}"
    placeholder="Enter bid amount"
  />

  <button id="place-bid-btn">Place Bid</button>
</div>

${highestBid ? '<button id="mark-sold-btn">Mark as SOLD</button>' : ''}
      ${liveAuction.bids.length === 0 ? '<button id="mark-unsold-btn">Mark as UNSOLD</button>' : ''}
    `;

    const placeBidButton = document.getElementById('place-bid-btn');

    placeBidButton.addEventListener('click', async () => {
      const teamId = document.getElementById('bid-team').value;
      const amount = Number(document.getElementById('bid-amount').value);

      if (!teamId || !Number.isFinite(amount) || amount <= 0) {
        alert('Please select a team and enter a valid bid amount');
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

    // Handle Mark as SOLD
    const soldButton = document.getElementById('mark-sold-btn');

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

    // 10. Handle Mark as UNSOLD
    const unsoldButton = document.getElementById('mark-unsold-btn');

    if (unsoldButton) {
      unsoldButton.addEventListener('click', async () => {
        try {
          await markAuctionUnsold(liveAuction._id);
          await loadAuctions();
        } catch (error) {
          alert(error.message);
        }
      });
    }
  } catch (error) {
    console.error('Failed to load auctions:', error.message);
  }
};

// 11. Load data when the page opens
loadAuctions();

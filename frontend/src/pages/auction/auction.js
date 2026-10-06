import './auction.scss';
import { getPlayers } from '../../api';



const app = document.getElementById('app');
const currentPlayer = document.querySelector('#current-player');

let players = [];
let selectedPlayer = null;


async function loadPlayers() {
  app.innerHTML = '<p>Loading players...</p>';


  try {
    const response = await getPlayers();

    players = response; // ✅ IMPORTANT LINE


    renderPlayers();
  } catch (error) {
    app.innerHTML = '<p>Error loading players</p>';
    console.error(error);
  }
}

function renderPlayers() {
  app.innerHTML = players
    .map(
      p => `
      <div class="card">
        <h3>${p.name}</h3>
        <p>Role: ${p.role}</p>
        <p>Country: ${p.country}</p>
        <strong>Base Price: ₹ ${p.basePrice}</strong>

        <button class="card__select" data-player-id="${p._id}">
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

      selectedPlayer = players.find(player => player._id === playerId);

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
  `;
}

// default page

loadPlayers();


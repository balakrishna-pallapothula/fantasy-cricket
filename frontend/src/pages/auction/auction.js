import './auction.scss';
import { getPlayers } from '../../api';


const tabs = document.querySelectorAll('.tab');
const app = document.getElementById('app');

let players = [];

const content = {
  live: 'Live matches will appear here',
  completed: 'Completed matches list',
  teams: 'Teams list goes here'
};

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const key = tab.dataset.tab;

    if (key === 'players') {
      loadPlayers();
    } else {
      app.innerHTML = `<p>${content[key]}</p>`;
    }

  });
});

async function loadPlayers() {
  app.innerHTML = '<p>Loading players...</p>';


  try {
    const response = await getPlayers();

    players = response; // ✅ IMPORTANT LINE
    console.log(players);

    renderPlayers();
  } catch (error) {
    app.innerHTML = '<p>Error loading players</p>';
    console.error(error);
  }
}

function renderPlayers(role = 'All') {
  const filteredPlayers =
    role === 'All'
      ? players
      : players.filter(p => p.role === role);

  app.innerHTML = filteredPlayers
    .map(
      p => `
      <div class="card">
        <h3>${p.name}</h3>
        <p>$${p.country}</p>
        <p>${p.average}</p>
        <strong>₹ ${p.highestScore}</strong>
      </div>
    `
    )
    .join('');
}


const filterButtons = document.querySelectorAll('.filter-buttons button');

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const role = btn.dataset.role;

    renderPlayers(role);
  });
});

// default page
app.innerHTML = `<p>${content.teams}</p>`;

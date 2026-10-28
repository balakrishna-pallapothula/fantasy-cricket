import './teams.scss';
import { getTeams } from '../../api';

const teamsList = document.querySelector('#teams-list');
let selectedTeamId = null;
let allTeams = [];
teamsList.addEventListener('click', (event) => {
  const teamCard = event.target.closest('[data-team-id]');

  if (!teamCard || !teamsList.contains(teamCard)) {
    return;
  }
  selectedTeamId = teamCard.dataset.teamId;
  renderTeams(allTeams);
});

async function loadTeams() {
  teamsList.innerHTML = '<p>Loading teams...</p>';

  try {
    const teams = await getTeams();

    allTeams = teams;

    renderTeams(teams);
  } catch (error) {
    teamsList.innerHTML = '<p>Error loading teams</p>';
    console.error(error);
  }
}

loadTeams();

function renderTeams(teams) {
  teamsList.innerHTML = teams
    .map((team) => {
      // Calculate total players
      const totalPlayers = team.players.length;

      // Calculate total auction spending
      const totalSpent = team.players.reduce((sum, player) => sum + (player.finalPrice ?? 0), 0);

      return `
<section class="team ${selectedTeamId === team._id ? 'team--active' : ''}">
    <h2>
  <button
    type="button"
    class="team__select"
    data-team-id="${team._id}"
    aria-expanded="${selectedTeamId === team._id}"
  >
    ${team.name}
  </button>
</h2>
<p>${team.franchise}</p>

          <p>Total Players: ${totalPlayers}</p>
          <p>Total Spent: ₹${totalSpent.toLocaleString('en-IN')}</p>

       <div class="team__players" ${selectedTeamId !== team._id ? 'hidden' : ''}>
            ${team.players.length > 0
          ? team.players
            .map(
              (player) => `
                        <div class="team__player">
                          <h3>${player.name}</h3>
                          <p>Role: ${player.role}</p>
                          <p>Sold Price: ₹${player.finalPrice?.toLocaleString('en-IN') ?? 'N/A'}</p>
                        </div>
                      `
            )
            .join('')
          : '<p>No players assigned</p>'
        }
          </div>
        </section>
      `;
    })
    .join('');
}

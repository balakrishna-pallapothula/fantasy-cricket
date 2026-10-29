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

  const clickedTeamId = teamCard.dataset.teamId;

  selectedTeamId =
    selectedTeamId === clickedTeamId ? null : clickedTeamId;

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

      const playerRoles = [
        'Batsman',
        'Bowler',
        'All-Rounder',
        'Wicket-Keeper',
      ];

      const groupedPlayers = playerRoles.map((role) => ({
        role,
        players: team.players.filter((player) => player.role === role),
      }));
      // Calculate total players
      const totalPlayers = team.players.length;

      // Calculate total auction spending
      const totalSpent = team.players.reduce((sum, player) => sum + (player.finalPrice ?? 0), 0);

      return `
<section class="team ${selectedTeamId === team._id ? 'team--active' : ''}">
    
<div class="team__header">
  <h2>${team.name}</h2>

  <button
    type="button"
    class="team__select"
    data-team-id="${team._id}"
    aria-expanded="${selectedTeamId === team._id}"
  >
    ${selectedTeamId === team._id ? 'Hide Squad' : 'View Squad'}
    <span class="team__chevron" aria-hidden="true">
      ${selectedTeamId === team._id ? '▲' : '▼'}
    </span>
  </button>
</div>


<div class="team__summary">
  <div class="team__stat">
    <span>Franchise</span>
    <strong>${team.franchise}</strong>
  </div>

  <div class="team__stat">
    <span>Total Players</span>
    <strong>${totalPlayers}</strong>
  </div>

  <div class="team__stat">
    <span>Total Spent</span>
    <strong>₹${totalSpent.toLocaleString('en-IN')}</strong>
  </div>
</div>


      
<div class="team__players" ${selectedTeamId !== team._id ? 'hidden' : ''}>
  ${groupedPlayers
          .filter((group) => group.players.length > 0)
          .map((group) => `
      <section class="team__role-group">
        <h3 class="team__role-title">
          ${group.role}
          <span>(${group.players.length})</span>
        </h3>

        <div class="team__role-players">
          ${group.players
              .map((player) => `
              <div class="team__player">
                <h4>${player.name}</h4>
                <p>
                  Sold Price:
                  ₹${player.finalPrice != null
                  ? player.finalPrice.toLocaleString('en-IN')
                  : 'N/A'}
                </p>
              </div>
            `)
              .join('')}
        </div>
      </section>
    `)
          .join('') || '<p>No players assigned</p>'}
</div>

        </section>
      `;
    })
    .join('');
}

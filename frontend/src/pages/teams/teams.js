import './teams.scss';
import { getTeams } from '../../api';

const teamsList = document.querySelector('#teams-list');

async function loadTeams() {
  teamsList.innerHTML = '<p>Loading teams...</p>';

  try {
    const teams = await getTeams();

    renderTeams(teams);
  } catch (error) {
    teamsList.innerHTML = '<p>Error loading teams</p>';
    console.error(error);
  }
}

loadTeams();

function renderTeams(teams) {
  teamsList.innerHTML = teams
    .map(
      (team) => `
        <section class="team">
          <h2>${team.name}</h2>
          <p>${team.franchise}</p>
          <div class="team__players">
  ${team.players.length > 0
          ? team.players
            .map(
              (player) => `
              <div class="team__player">
                <h3>${player.name}</h3>
                <p>Role: ${player.role}</p>
                <p>Sold Price: ₹ ${player.finalPrice}</p>
              </div>
            `
            )
            .join('')
          : '<p>No players assigned</p>'
        }
</div>
        </section>
      `
    )
    .join('');
}
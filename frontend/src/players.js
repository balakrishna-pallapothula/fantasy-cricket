import { getPlayers } from './api';

export const renderPlayers = async () => {
  const container = document.getElementById('players');
  container.innerHTML = '<h2>Players</h2>';

  const response = await getPlayers();
  const players = response.data; // IMPORTANT

  players.forEach(player => {
    const div = document.createElement('div');
    div.style.border = '1px solid #ccc';
    div.style.padding = '8px';
    div.style.margin = '6px 0';

    div.innerHTML = `
      <strong>${player.name}</strong><br/>
      Role: ${player.role}<br/>
      Team: ${player.team}<br/>
      Price: ${player.price}
    `;

    container.appendChild(div);
  });
};

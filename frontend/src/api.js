
const BASE_URL = 'http://localhost:5000/api';

export const getPlayers = async () => {
  const res = await fetch(`${BASE_URL}/players`);
  return res.json();
};

export const getTeams = async () => {
  const res = await fetch(`${BASE_URL}/teams`);

  if (!res.ok) {
    throw new Error('Failed to fetch teams');
  }

  return res.json();
};

export const createPlayer = async (player) => {
  const res = await fetch(`${BASE_URL}/players`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(player),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to create player');
  }

  return data;
};

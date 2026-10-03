const BASE_URL = 'http://localhost:5000/api';

export const getPlayers = async () => {
  const res = await fetch(`${BASE_URL}/players`);
  return res.json();
};


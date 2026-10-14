
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

export const createAuction = async (playerId, setNumber) => {
  const res = await fetch(`${BASE_URL}/auction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      playerId,
      setNumber,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to create auction');
  }

  return data;
};

export const startAuction = async (auctionId) => {
  const res = await fetch(`${BASE_URL}/auction/${auctionId}/start`, {
    method: 'PATCH',
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to start auction');
  }

  return data;
};

export const placeBid = async (auctionId, teamId, amount) => {
  const res = await fetch(`${BASE_URL}/auction/${auctionId}/bids`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      teamId,
      amount,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to place bid');
  }

  return data;
};

export const getAuctions = async () => {
  const res = await fetch(`${BASE_URL}/auction`);

  if (!res.ok) {
    throw new Error('Failed to fetch auctions');
  }

  return res.json();
};

export const markAuctionSold = async (auctionId) => {
  const res = await fetch(`${BASE_URL}/auction/${auctionId}/sold`, {
    method: 'PATCH',
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to mark auction as sold');
  }

  return data;
};

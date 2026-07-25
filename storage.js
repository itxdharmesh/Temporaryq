import { generateStarterSquad, generateMarketPool } from './players-db.js';

const STORAGE_KEY_PREFIX = 'apex_football_save_';

export function getSaveKey(uid) {
  return `${STORAGE_KEY_PREFIX}${uid}`;
}

export function loadGameState(uid) {
  try {
    const raw = localStorage.getItem(getSaveKey(uid));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load local save:", err);
    return null;
  }
}

export function saveGameState(uid, data) {
  try {
    data.lastSavedAt = new Date().toISOString();
    localStorage.setItem(getSaveKey(uid), JSON.stringify(data));
    return true;
  } catch (err) {
    console.error("Failed to save local save:", err);
    return false;
  }
}

export function createInitialClubState(uid, clubName, themeColor) {
  const clubCode = 'APX-' + Math.floor(1000 + Math.random() * 9000);
  
  const newState = {
    uid: uid,
    club: {
      name: clubName,
      code: clubCode,
      themeColor: themeColor,
      level: 1,
      xp: 0,
      maxXp: 500,
      rankPoints: 1000,
      division: "Bronze III"
    },
    finances: {
      walletBalance: 40000,        // Starting Wallet: ₹40,000
      bankBalance: 2000000,        // Starting GDP Bank: ₹20,00,000
      loans: [],
      transactionHistory: [
        { id: 1, type: 'Credit', amount: 40000, desc: 'Initial Wallet Allocation', date: new Date().toLocaleDateString() },
        { id: 2, type: 'Credit', amount: 2000000, desc: 'GDP Bank Opening Deposit', date: new Date().toLocaleDateString() }
      ]
    },
    squad: generateStarterSquad(),      // 11 starting players
    marketPool: generateMarketPool(16), // 16 market listings
    marketHistory: [],
    matchHistory: [],
    news: [
      { id: 1, title: 'Club Registered', text: `${clubName} has officially entered the Apex League Universe. Starter squad assigned.`, time: 'Just now' }
    ],
    createdAt: new Date().toISOString()
  };

  saveGameState(uid, newState);
  return newState;
}

// Helper to record a financial transaction
export function recordTransaction(state, type, amount, description) {
  state.finances.transactionHistory.unshift({
    id: Date.now(),
    type,
    amount,
    desc: description,
    date: new Date().toLocaleDateString()
  });
}

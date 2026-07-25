import { renderPlayerCardHTML, openPlayerModal } from './squad.js';
import { generateFictionalPlayer, generateMarketPool } from './players-db.js';
import { saveGameState, recordTransaction } from './store.js';
import { formatCurrency } from './app.js';

let activeState = null;

export function initMarketView(state) {
  activeState = state;
  
  // Replenish market pool if empty
  if (!activeState.marketPool || activeState.marketPool.length < 5) {
    activeState.marketPool = generateMarketPool(16);
    saveGameState(activeState.uid, activeState);
  }

  attachFilterListeners();
  renderMarketListings();
}

function attachFilterListeners() {
  const searchInput = document.getElementById('market-search');
  const posFilter = document.getElementById('market-filter-pos');
  const rarityFilter = document.getElementById('market-filter-rarity');

  const triggerRender = () => renderMarketListings();

  if (searchInput) searchInput.oninput = triggerRender;
  if (posFilter) posFilter.onchange = triggerRender;
  if (rarityFilter) rarityFilter.onchange = triggerRender;
}

/**
 * Filter and render market player listings
 */
export function renderMarketListings() {
  const container = document.getElementById('market-card-grid');
  if (!container || !activeState) return;

  const searchQuery = (document.getElementById('market-search')?.value || '').toLowerCase();
  const selectedPos = document.getElementById('market-filter-pos')?.value || 'ALL';
  const selectedRarity = document.getElementById('market-filter-rarity')?.value || 'ALL';

  let listings = activeState.marketPool || [];

  // Filter apply
  listings = listings.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery);
    const matchesPos = selectedPos === 'ALL' || player.position === selectedPos;
    const matchesRarity = selectedRarity === 'ALL' || player.rarity.name.toUpperCase() === selectedRarity.toUpperCase();
    return matchesSearch && matchesPos && matchesRarity;
  });

  if (listings.length === 0) {
    container.innerHTML = `<div class="empty-state">No matching players found on the transfer wire.</div>`;
    return;
  }

  container.innerHTML = listings.map(player => renderPlayerCardHTML(player, 'market')).join('');

  // Attach card click listeners to trigger buy modal
  container.querySelectorAll('.player-card').forEach(card => {
    card.addEventListener('click', () => {
      const playerId = card.dataset.id;
      const player = listings.find(p => p.id === playerId);
      if (player) openMarketBuyModal(player);
    });
  });
}

/**
 * Opens Buy Confirmation Modal
 */
function openMarketBuyModal(player) {
  openPlayerModal(player, 'market');

  const buyBtn = document.getElementById('buy-player-btn');
  if (buyBtn) {
    buyBtn.onclick = () => buyPlayer(player);
  }
}

/**
 * Executes player purchasing logic
 */
function buyPlayer(player) {
  const cost = player.value;
  const currentBank = activeState.finances.bankBalance;

  if (currentBank < cost) {
    alert(`Insufficient funds in GDP Bank! You need ${formatCurrency(cost)} but only have ${formatCurrency(currentBank)}.`);
    return;
  }

  if (!confirm(`Confirm purchase of ${player.name} for ${formatCurrency(cost)} from GDP Bank?`)) return;

  // Deduct bank balance
  activeState.finances.bankBalance -= cost;
  
  // Move player from Market Pool to Squad
  activeState.marketPool = activeState.marketPool.filter(p => p.id !== player.id);
  activeState.squad.push(player);

  // Record Transaction
  recordTransaction(activeState, 'Debit', cost, `Transfer Fee: Purchased ${player.name}`);

  // News Bulletin
  activeState.news.unshift({
    id: Date.now(),
    title: 'New Signing!',
    text: `${activeState.club.name} signed ${player.name} (${player.position}) for ${formatCurrency(cost)}.`,
    time: 'Just now'
  });

  // Dynamically add a new player to the market pool to keep market active
  activeState.marketPool.push(generateFictionalPlayer(`MKT-REFILL-${Date.now()}`));

  saveGameState(activeState.uid, activeState);

  // Close modal and refresh UI
  document.getElementById('player-detail-modal').classList.add('hidden');
  renderMarketListings();

  // Trigger app state sync
  window.dispatchEvent(new CustomEvent('state-updated'));
}
q

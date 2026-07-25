import { saveGameState, recordTransaction } from './store.js';
import { formatCurrency } from './app.js';

let activeState = null;
let selectedPlayer = null;

export function initSquadView(state) {
  activeState = state;
  renderSquadGrid();
}

/**
 * Calculates Team Average Overall Rating
 */
export function getTeamOverall(squad) {
  if (!squad || squad.length === 0) return 0;
  const total = squad.reduce((sum, p) => sum + p.ovr, 0);
  return Math.round(total / squad.length);
}

/**
 * Renders the squad list as interactive FUT-style player cards
 */
export function renderSquadGrid() {
  const container = document.getElementById('squad-card-grid');
  const countEl = document.getElementById('squad-count');
  const ratingEl = document.getElementById('squad-avg-rating');

  if (!container || !activeState) return;

  const squad = activeState.squad || [];
  countEl.innerText = `${squad.length} Players`;
  ratingEl.innerText = `OVR ${getTeamOverall(squad)}`;

  if (squad.length === 0) {
    container.innerHTML = `<div class="empty-state">No players in your squad. Visit the Transfer Market to sign players!</div>`;
    return;
  }

  container.innerHTML = squad.map(player => renderPlayerCardHTML(player, 'squad')).join('');

  // Attach card click listeners for player inspect modal
  container.querySelectorAll('.player-card').forEach(card => {
    card.addEventListener('click', () => {
      const playerId = card.dataset.id;
      const player = squad.find(p => p.id === playerId);
      if (player) openPlayerModal(player, 'squad');
    });
  });
}

/**
 * Reusable HTML generator for Fut-style Player Cards
 */
export function renderPlayerCardHTML(player, context = 'squad') {
  const { id, name, ovr, position, nationality, pac, sho, pas, dri, def, phy, value, rarity, avatarUrl } = player;
  
  return `
    <div class="player-card ${rarity.class}" data-id="${id}">
      <div class="card-inner">
        <div class="card-top">
          <div class="rating-box">
            <span class="card-ovr">${ovr}</span>
            <span class="card-pos">${position}</span>
          </div>
          <img src="${avatarUrl}" class="card-avatar" alt="${name}" loading="lazy" />
        </div>
        <div class="card-info">
          <div class="card-name">${name}</div>
          <div class="card-flag">${nationality}</div>
        </div>
        <div class="card-stats-grid">
          <div><span>PAC</span> <strong>${pac}</strong></div>
          <div><span>SHO</span> <strong>${sho}</strong></div>
          <div><span>PAS</span> <strong>${pas}</strong></div>
          <div><span>DRI</span> <strong>${dri}</strong></div>
          <div><span>DEF</span> <strong>${def}</strong></div>
          <div><span>PHY</span> <strong>${phy}</strong></div>
        </div>
        <div class="card-footer">
          <span class="card-val">${formatCurrency(value)}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Opens detailed view modal for a player
 */
export function openPlayerModal(player, mode = 'squad') {
  selectedPlayer = player;
  const modal = document.getElementById('player-detail-modal');
  const content = document.getElementById('modal-player-content');

  content.innerHTML = `
    <div class="modal-card-wrapper">
      ${renderPlayerCardHTML(player, 'modal')}
    </div>
    <div class="player-bio-details">
      <h3>${player.name}</h3>
      <p class="bio-subtitle">${player.position} | ${player.age} Years | ${player.nationality}</p>
      
      <div class="bio-grid">
        <div><span>Market Value:</span> <strong>${formatCurrency(player.value)}</strong></div>
        <div><span>Weekly Salary:</span> <strong>${formatCurrency(player.salary)}</strong></div>
        <div><span>Contract:</span> <strong>${player.contract} Years</strong></div>
        <div><span>Form:</span> <strong class="text-green">${player.form}</strong></div>
        <div><span>Fitness:</span> <strong>${player.fitness}%</strong></div>
        <div><span>Morale:</span> <strong>${player.morale}%</strong></div>
      </div>

      <div class="modal-actions">
        ${mode === 'squad' ? `
          <button id="sell-player-btn" class="btn btn-danger btn-block">Sell Player (${formatCurrency(Math.round(player.value * 0.85))})</button>
        ` : `
          <button id="buy-player-btn" class="btn btn-success btn-block">Buy Player (${formatCurrency(player.value)})</button>
        `}
      </div>
    </div>
  `;

  modal.classList.remove('hidden');

  // Attach action button listener inside modal
  const sellBtn = document.getElementById('sell-player-btn');
  if (sellBtn) {
    sellBtn.addEventListener('click', () => sellPlayer(player));
  }
}

/**
 * Executes player selling logic
 */
function sellPlayer(player) {
  if (activeState.squad.length <= 11) {
    alert("You cannot sell a player! A minimum squad size of 11 players is required.");
    return;
  }

  const sellPrice = Math.round(player.value * 0.85); // 15% transfer fee deduction
  if (!confirm(`Sell ${player.name} for ${formatCurrency(sellPrice)}?`)) return;

  // Remove player from squad
  activeState.squad = activeState.squad.filter(p => p.id !== player.id);

  // Credit funds to GDP Bank
  activeState.finances.bankBalance += sellPrice;
  recordTransaction(activeState, 'Credit', sellPrice, `Transfer Fee: Sold ${player.name}`);

  // Push to news
  activeState.news.unshift({
    id: Date.now(),
    title: 'Player Sold',
    text: `${player.name} was transferred out for ${formatCurrency(sellPrice)}.`,
    time: 'Just now'
  });

  saveGameState(activeState.uid, activeState);
  
  // Close modal and refresh UI
  document.getElementById('player-detail-modal').classList.add('hidden');
  renderSquadGrid();

  // Trigger app dashboard sync event
  window.dispatchEvent(new CustomEvent('state-updated'));
}

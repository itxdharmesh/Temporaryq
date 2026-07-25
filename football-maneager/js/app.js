import { initAuthListeners } from './auth.js';
import { loadGameState } from './store.js';
import { initClubForm } from './club.js';

let currentUser = null;
let gameState = null;

// VIEW SWITCHER
export function showView(viewId) {
  const views = document.querySelectorAll('.view');
  views.forEach(v => {
    if (v.id === viewId) {
      v.classList.remove('hidden');
      v.classList.add('active');
    } else {
      v.classList.add('hidden');
      v.classList.remove('active');
    }
  });
}

// FORMAT CURRENCY TO INDIAN RUPEE FORMAT (₹)
export function formatCurrency(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

// HANDLE FIREBASE AUTH STATE
export function handleAuthState(user) {
  currentUser = user;

  if (!user) {
    gameState = null;
    showView('view-auth');
    return;
  }

  // Load game state for current user ID
  gameState = loadGameState(user.uid);

  if (!gameState) {
    // New user with no local club -> proceed to Club Creation
    showView('view-club-create');
    initClubForm(currentUser, (newSave) => {
      gameState = newSave;
      renderDashboard();
      showView('view-dashboard');
    });
  } else {
    // Existing user with save -> render Dashboard
    renderDashboard();
    showView('view-dashboard');
  }
}

// RENDER DASHBOARD METRICS
export function renderDashboard() {
  if (!gameState) return;

  const { club, finances, news } = gameState;

  document.getElementById('dash-club-name').innerText = club.name;
  document.getElementById('dash-club-code').innerText = club.code;
  document.getElementById('dash-club-badge').style.borderColor = club.themeColor;

  document.getElementById('dash-wallet-bal').innerText = formatCurrency(finances.walletBalance);
  document.getElementById('dash-bank-bal').innerText = formatCurrency(finances.bankBalance);

  document.getElementById('dash-club-level').innerText = `Lvl ${club.level}`;
  document.getElementById('dash-rank-points').innerText = club.rankPoints.toLocaleString();
  document.getElementById('dash-division-badge').innerText = club.division;

  const xpPercent = Math.min(100, Math.floor((club.xp / club.maxXp) * 100));
  document.getElementById('dash-xp-progress').style.width = `${xpPercent}%`;

  // Render news feed
  const newsContainer = document.getElementById('news-feed-list');
  if (news && news.length > 0) {
    newsContainer.innerHTML = news.map(item => `
      <div class="news-item">
        <span class="news-time">${item.time}</span>
        <p class="news-text">${item.text}</p>
      </div>
    `).join('');
  }
}

// INITIALIZE APP ON LOAD
window.addEventListener('DOMContentLoaded', () => {
  // Show Loading Screen briefly during initialization
  showView('view-loading');
  initAuthListeners();
});

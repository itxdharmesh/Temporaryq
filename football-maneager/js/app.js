import { initAuthListeners } from './auth.js';
import { loadGameState } from './store.js';
import { initClubForm } from './club.js';
import { initSquadView, renderSquadGrid } from './squad.js';
import { initMarketView, renderMarketListings } from './market.js';

let currentUser = null;
let gameState = null;

// ROUTE & TAB NAVIGATION
window.navigateToTab = function(viewId) {
  const views = document.querySelectorAll('.view');
  views.forEach(v => {
    if (v.id === viewId) {
      v.classList.remove('hidden');
    } else {
      v.classList.add('hidden');
    }
  });

  // Update bottom nav highlights
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    if (btn.dataset.target === viewId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // View specific re-renders
  if (viewId === 'view-squad') renderSquadGrid();
  if (viewId === 'view-market') renderMarketListings();
  if (viewId === 'view-dashboard') renderDashboard();
};

export function showView(viewId) {
  window.navigateToTab(viewId);
}

// FORMAT CURRENCY TO INDIAN RUPEE FORMAT (₹)
export function formatCurrency(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

// HANDLE FIREBASE AUTH STATE
export function handleAuthState(user) {
  currentUser = user;
  const navBar = document.getElementById('app-bottom-nav');

  if (!user) {
    gameState = null;
    navBar.classList.add('hidden');
    showView('view-auth');
    return;
  }

  // Load game state
  gameState = loadGameState(user.uid);

  if (!gameState) {
    navBar.classList.add('hidden');
    showView('view-club-create');
    initClubForm(currentUser, (newSave) => {
      gameState = newSave;
      initPhase2Modules();
      navBar.classList.remove('hidden');
      renderDashboard();
      showView('view-dashboard');
    });
  } else {
    initPhase2Modules();
    navBar.classList.remove('hidden');
    renderDashboard();
    showView('view-dashboard');
  }
}

// INITIALIZE MODULES
function initPhase2Modules() {
  initSquadView(gameState);
  initMarketView(gameState);
}

// RENDER DASHBOARD & GLOBAL BALANCE SYNC
export function renderDashboard() {
  if (!gameState) return;

  const { club, finances, news } = gameState;

  // Header and Club Details
  document.getElementById('dash-club-name').innerText = club.name;
  document.getElementById('dash-club-code').innerText = club.code;
  document.getElementById('dash-club-badge').style.borderColor = club.themeColor;

  // Global Currency Sync across all views
  document.querySelectorAll('.dash-wallet-bal').forEach(el => {
    el.innerText = formatCurrency(finances.walletBalance);
  });
  document.querySelectorAll('.dash-bank-bal').forEach(el => {
    el.innerText = formatCurrency(finances.bankBalance);
  });

  // Progress metrics
  document.getElementById('dash-club-level').innerText = `Lvl ${club.level}`;
  document.getElementById('dash-rank-points').innerText = club.rankPoints.toLocaleString();
  document.getElementById('dash-division-badge').innerText = club.division;

  const xpPercent = Math.min(100, Math.floor((club.xp / club.maxXp) * 100));
  document.getElementById('dash-xp-progress').style.width = `${xpPercent}%`;

  // News Bulletin
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

// LISTEN TO STATE CHANGES (BUY/SELL)
window.addEventListener('state-updated', () => {
  renderDashboard();
});

// INITIALIZE APP
window.addEventListener('DOMContentLoaded', () => {
  showView('view-loading');
  initAuthListeners();

  // Attach logout handler for all logout buttons
  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.onclick = () => {
      import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js').then(({ signOut }) => {
        import('./firebase-config.js').then(({ auth }) => signOut(auth));
      });
    };
  });
});

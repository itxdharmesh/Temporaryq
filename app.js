import { initAuthListeners } from './auth.js';
import { loadGameState } from './store.js';
import { initClubForm } from './club.js';
import { initSquadView, renderSquadGrid } from './squad.js';
import { initMarketView, renderMarketListings } from './market.js';
import { initMatchView, startLiveMatch } from './match-ui.js';

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

  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    if (btn.dataset.target === viewId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (viewId === 'view-squad') renderSquadGrid();
  if (viewId === 'view-market') renderMarketListings();
  if (viewId === 'view-match') initMatchView(gameState);
  if (viewId === 'view-dashboard') renderDashboard();
};

export function showView(viewId) {
  window.navigateToTab(viewId);
}

export function formatCurrency(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

export function handleAuthState(user) {
  currentUser = user;
  const navBar = document.getElementById('app-bottom-nav');

  if (!user) {
    gameState = null;
    navBar.classList.add('hidden');
    showView('view-auth');
    return;
  }

  gameState = loadGameState(user.uid);

  if (!gameState) {
    navBar.classList.add('hidden');
    showView('view-club-create');
    initClubForm(currentUser, (newSave) => {
      gameState = newSave;
      initPhaseModules();
      navBar.classList.remove('hidden');
      renderDashboard();
      showView('view-dashboard');
    });
  } else {
    initPhaseModules();
    navBar.classList.remove('hidden');
    renderDashboard();
    showView('view-dashboard');
  }
}

function initPhaseModules() {
  initSquadView(gameState);
  initMarketView(gameState);
  initMatchView(gameState);
}

export function renderDashboard() {
  if (!gameState) return;

  const { club, finances, news } = gameState;

  document.getElementById('dash-club-name').innerText = club.name;
  document.getElementById('dash-club-code').innerText = club.code;
  document.getElementById('dash-club-badge').style.borderColor = club.themeColor;

  document.querySelectorAll('.dash-wallet-bal').forEach(el => {
    el.innerText = formatCurrency(finances.walletBalance);
  });
  document.querySelectorAll('.dash-bank-bal').forEach(el => {
    el.innerText = formatCurrency(finances.bankBalance);
  });

  document.getElementById('dash-club-level').innerText = `Lvl ${club.level}`;
  document.getElementById('dash-rank-points').innerText = club.rankPoints.toLocaleString();
  document.getElementById('dash-division-badge').innerText = club.division;

  const xpPercent = Math.min(100, Math.floor((club.xp / club.maxXp) * 100));
  document.getElementById('dash-xp-progress').style.width = `${xpPercent}%`;

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

// Global Match Launch Handlers
window.startLeagueMatch = function() {
  startLiveMatch(false); // League mode (draws allowed)
};

window.startKnockoutMatch = function() {
  startLiveMatch(true); // Knockout mode (penalties on draw)
};

window.addEventListener('state-updated', () => {
  renderDashboard();
});

window.addEventListener('DOMContentLoaded', () => {
  showView('view-loading');
  initAuthListeners();

  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.onclick = () => {
      import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js').then(({ signOut }) => {
        import('./firebase-config.js').then(({ auth }) => signOut(auth));
      });
    };
  });
});

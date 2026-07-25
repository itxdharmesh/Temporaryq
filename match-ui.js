import { getRandomOpponent, generateMatchTimeline, simulatePenaltyShootout, TACTICS_CONFIG } from './match-engine.js';
import { saveGameState, recordTransaction } from './store.js';
import { formatCurrency } from './app.js';

let currentGameState = null;
let activeOpponent = null;
let matchSimulationTimer = null;
let currentMinute = 0;
let homeScore = 0;
let awayScore = 0;
let matchTimeline = [];
let currentTactic = "Balanced";
let isMatchRunning = false;
let isKnockoutMode = false;

export function initMatchView(state) {
  currentGameState = state;
  resetMatchArea();
}

function resetMatchArea() {
  activeOpponent = getRandomOpponent();
  currentMinute = 0;
  homeScore = 0;
  awayScore = 0;
  isMatchRunning = false;
  currentTactic = "Balanced";

  document.getElementById('match-home-name').innerText = currentGameState.club.name;
  document.getElementById('match-away-name').innerText = activeOpponent.name;
  document.getElementById('match-score').innerText = "0 - 0";
  document.getElementById('match-clock').innerText = "00'";
  document.getElementById('match-events-feed').innerHTML = `<div class="empty-state">Tap 'Kick Off' to start the live simulation.</div>`;
  
  document.getElementById('start-match-btn').classList.remove('hidden');
  document.getElementById('tactics-controls').classList.add('hidden');
  document.getElementById('momentum-bar-fill').style.width = "50%";
  document.getElementById('momentum-text').innerText = "Momentum: 50% - 50%";
}

/**
 * Starts the live minute-by-minute match simulation loop
 */
export function startLiveMatch(isKnockout = false) {
  if (isMatchRunning) return;
  isMatchRunning = true;
  isKnockoutMode = isKnockout;

  document.getElementById('start-match-btn').classList.add('hidden');
  document.getElementById('tactics-controls').classList.remove('hidden');
  document.getElementById('match-events-feed').innerHTML = '';

  // Generate timeline
  const result = generateMatchTimeline(currentGameState.club, activeOpponent, currentTactic, isKnockout);
  matchTimeline = result.timeline;

  currentMinute = 1;
  runMatchTicker();
}

/**
 * Minute Ticker Loop (1 tick = 150ms)
 */
function runMatchTicker() {
  if (currentMinute > 90) {
    handleFullTime();
    return;
  }

  // Half-time Pause (45')
  if (currentMinute === 45) {
    document.getElementById('match-clock').innerText = "45' (HT)";
    appendEventFeed("⏸️ HALF TIME - Teams head into the tunnel.", "neutral");
    
    setTimeout(() => {
      currentMinute = 46;
      runMatchTicker();
    }, 4000); // 4 Second Pause
    return;
  }

  document.getElementById('match-clock').innerText = `${currentMinute}'`;

  // Process events for this minute
  const eventsThisMin = matchTimeline.filter(e => e.minute === currentMinute);
  eventsThisMin.forEach(evt => {
    if (evt.homeScore !== undefined) homeScore = evt.homeScore;
    if (evt.awayScore !== undefined) awayScore = evt.awayScore;

    document.getElementById('match-score').innerText = `${homeScore} - ${awayScore}`;
    appendEventFeed(`${evt.minute}' ${evt.text}`, evt.team);
  });

  // Dynamic Momentum fluctuation
  updateMomentum();

  currentMinute++;
  matchSimulationTimer = setTimeout(runMatchTicker, 150);
}

/**
 * Updates live momentum display based on tactics & score
 */
function updateMomentum() {
  const tacticMod = TACTICS_CONFIG[currentTactic].possessionMod;
  const scoreDiff = (homeScore - awayScore) * 0.05;
  const randomShift = (Math.random() - 0.5) * 0.1;

  let homeRatio = Math.max(0.2, Math.min(0.8, tacticMod + scoreDiff + randomShift));
  let homePct = Math.round(homeRatio * 100);
  let awayPct = 100 - homePct;

  document.getElementById('momentum-bar-fill').style.width = `${homePct}%`;
  document.getElementById('momentum-text').innerText = `Momentum: ${homePct}% - ${awayPct}%`;
}

/**
 * Handles Live Tactical Switch mid-match
 */
window.setMatchTactic = function(tacticName) {
  currentTactic = tacticName;
  document.querySelectorAll('.tactic-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tactic === tacticName);
  });
  appendEventFeed(`📋 Tactical adjustment: Switch to ${tacticName}`, "neutral");
};

function appendEventFeed(text, team = "neutral") {
  const feed = document.getElementById('match-events-feed');
  const item = document.createElement('div');
  item.className = `event-item event-${team}`;
  item.innerText = text;
  feed.prepend(item);
}

/**
 * Full Time Handler & Reward Allocation
 */
function handleFullTime() {
  isMatchRunning = false;
  document.getElementById('match-clock').innerText = "90' (FT)";

  // Check for Knockout Penalty Shootout
  if (isKnockoutMode && homeScore === awayScore) {
    appendEventFeed("⚖️ FULL TIME DRAW! Proceeding to Penalty Shootout...", "neutral");
    setTimeout(triggerPenaltyShootout, 2000);
    return;
  }

  // Calculate Rewards
  let rewardMoney = 0;
  let xpEarned = 0;
  let rankEarned = 0;
  let matchResult = "";

  if (homeScore > awayScore) {
    matchResult = "WIN";
    rewardMoney = 50000;
    xpEarned = 120;
    rankEarned = 25;
  } else if (homeScore === awayScore) {
    matchResult = "DRAW";
    rewardMoney = 20000;
    xpEarned = 50;
    rankEarned = 8;
  } else {
    matchResult = "LOSS";
    rewardMoney = 8000;
    xpEarned = 20;
    rankEarned = -10;
  }

  // Apply State Changes
  currentGameState.finances.walletBalance += rewardMoney;
  currentGameState.club.xp += xpEarned;
  currentGameState.club.rankPoints = Math.max(0, currentGameState.club.rankPoints + rankEarned);

  // Level Up Check
  if (currentGameState.club.xp >= currentGameState.club.maxXp) {
    currentGameState.club.level += 1;
    currentGameState.club.xp -= currentGameState.club.maxXp;
    currentGameState.club.maxXp = Math.round(currentGameState.club.maxXp * 1.4);
  }

  recordTransaction(currentGameState, 'Credit', rewardMoney, `Match Purse (${matchResult} vs ${activeOpponent.name})`);

  currentGameState.news.unshift({
    id: Date.now(),
    title: `Match Result: ${matchResult}`,
    text: `${currentGameState.club.name} ${homeScore} - ${awayScore} ${activeOpponent.name}. Earned ${formatCurrency(rewardMoney)}.`,
    time: 'Just now'
  });

  saveGameState(currentGameState.uid, currentGameState);

  // Trigger Result Modal
  showMatchResultModal(matchResult, homeScore, awayScore, rewardMoney, xpEarned, rankEarned);
}

/**
 * Triggers Knockout Penalty Shootout UI & Engine
 */
function triggerPenaltyShootout() {
  const { shootout, homePenalties, awayPenalties } = simulatePenaltyShootout(currentGameState.club.squad, activeOpponent.squad);
  
  const modal = document.getElementById('shootout-modal');
  const feed = document.getElementById('shootout-results-list');
  feed.innerHTML = '';

  modal.classList.remove('hidden');

  shootout.forEach((shot, index) => {
    setTimeout(() => {
      const item = document.createElement('div');
      item.className = `shootout-item ${shot.success ? 'success' : 'miss'}`;
      item.innerText = `R${shot.round} [${shot.team.toUpperCase()}] ${shot.player}: ${shot.success ? '⚽ GOAL' : '❌ MISSED'} (${shot.currentScore})`;
      feed.appendChild(item);

      if (index === shootout.length - 1) {
        setTimeout(() => {
          modal.classList.add('hidden');
          if (homePenalties > awayPenalties) homeScore++;
          handleFullTime();
        }, 3000);
      }
    }, index * 800);
  });
}

function showMatchResultModal(result, hScore, aScore, purse, xp, rank) {
  const modal = document.getElementById('match-result-modal');
  document.getElementById('res-title').innerText = result === "WIN" ? "🏆 VICTORY!" : result === "DRAW" ? "🤝 DRAW" : "💔 DEFEAT";
  document.getElementById('res-score').innerText = `${hScore} - ${aScore}`;
  document.getElementById('res-purse').innerText = formatCurrency(purse);
  document.getElementById('res-xp').innerText = `+${xp} XP`;
  document.getElementById('res-rank').innerText = `${rank >= 0 ? '+' : ''}${rank} RP`;

  modal.classList.remove('hidden');

  document.getElementById('res-close-btn').onclick = () => {
    modal.classList.add('hidden');
    resetMatchArea();
    window.dispatchEvent(new CustomEvent('state-updated'));
    window.navigateToTab('view-dashboard');
  };
}

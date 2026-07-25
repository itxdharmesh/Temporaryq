import { generateFictionalPlayer } from './players-db.js';

// TACTICS MODIFIERS
export const TACTICS_CONFIG = {
  "Defensive": { attackMod: 0.75, defenceMod: 1.30, possessionMod: 0.42 },
  "Balanced": { attackMod: 1.00, defenceMod: 1.00, possessionMod: 0.50 },
  "Attacking": { attackMod: 1.25, defenceMod: 0.85, possessionMod: 0.58 },
  "All Out Attack": { attackMod: 1.50, defenceMod: 0.65, possessionMod: 0.65 }
};

// OPPONENT FICTIONAL CLUBS
const UNIVERSE_CLUBS = [
  { name: "Aethelgard Albion", color: "#e11d48", rating: 68 },
  { name: "Solaria Wanderers", color: "#d97706", rating: 72 },
  { name: "Vanguard Sterling", color: "#0284c7", rating: 65 },
  { name: "Ironclad City", color: "#475569", rating: 76 },
  { name: "Elysium Stars", color: "#9333ea", rating: 70 }
];

export function getRandomOpponent() {
  const template = UNIVERSE_CLUBS[Math.floor(Math.random() * UNIVERSE_CLUBS.length)];
  return {
    name: template.name,
    themeColor: template.color,
    rating: template.rating,
    squad: Array.from({ length: 11 }, (_, i) => generateFictionalPlayer(`OPP-${i}`, template.rating + Math.floor(Math.random() * 6) - 3))
  };
}

/**
 * Calculates Attack/Defence ratings from starting XI and chosen tactic
 */
export function calculateTeamRating(squad, tacticName = "Balanced") {
  if (!squad || squad.length === 0) return { attack: 60, defence: 60, total: 60 };

  const totalOvr = squad.reduce((sum, p) => sum + p.ovr, 0) / squad.length;
  const mod = TACTICS_CONFIG[tacticName] || TACTICS_CONFIG["Balanced"];

  return {
    attack: Math.round(totalOvr * mod.attackMod),
    defence: Math.round(totalOvr * mod.defenceMod),
    total: Math.round(totalOvr)
  };
}

/**
 * Generates a full match schedule of events pre-calculated minute by minute
 */
export function generateMatchTimeline(homeClub, awayClub, homeTactic, isKnockout = false) {
  const homeStats = calculateTeamRating(homeClub.squad, homeTactic);
  const awayStats = calculateTeamRating(awayClub.squad, "Balanced");

  // Home Advantage boost
  const homeAttack = homeStats.attack + 3;
  const homeDefence = homeStats.defence + 3;

  const timeline = [];
  let homeScore = 0;
  let awayScore = 0;

  for (let minute = 1; minute <= 90; minute++) {
    // 8% chance of an event happening in any given minute
    if (Math.random() < 0.08) {
      const isHomeEvent = Math.random() < (homeAttack / (homeAttack + awayStats.defence));
      const attackingClub = isHomeEvent ? homeClub : awayClub;
      const defendingClub = isHomeEvent ? awayClub : homeClub;
      const attackingSquad = attackingClub.squad;

      const eventRoll = Math.random();

      if (eventRoll < 0.35) { // GOAL
        const scorer = attackingSquad[Math.floor(Math.random() * attackingSquad.length)];
        const assister = attackingSquad.filter(p => p.id !== scorer.id)[Math.floor(Math.random() * (attackingSquad.length - 1))];

        if (isHomeEvent) homeScore++; else awayScore++;

        timeline.push({
          minute,
          type: "GOAL",
          team: isHomeEvent ? "home" : "away",
          text: `⚽ GOAL! ${scorer.name} ${assister ? `(Assist: ${assister.name})` : ''}`,
          homeScore,
          awayScore
        });
      } else if (eventRoll < 0.65) { // SAVED / CHANCE
        const shooter = attackingSquad[Math.floor(Math.random() * attackingSquad.length)];
        timeline.push({
          minute,
          type: "CHANCE",
          team: isHomeEvent ? "home" : "away",
          text: `🧤 Big save! ${shooter.name}'s shot was stopped by the keeper.`
        });
      } else if (eventRoll < 0.85) { // YELLOW CARD
        const cardedPlayer = defendingClub.squad[Math.floor(Math.random() * defendingClub.squad.length)];
        timeline.push({
          minute,
          type: "CARD",
          team: isHomeEvent ? "away" : "home",
          text: `🟨 Yellow Card issued to ${cardedPlayer.name}.`
        });
      } else { // RED CARD / PENALTY
        const penaltyScorer = attackingSquad[0];
        if (Math.random() < 0.70) {
          if (isHomeEvent) homeScore++; else awayScore++;
          timeline.push({
            minute,
            type: "PENALTY_GOAL",
            team: isHomeEvent ? "home" : "away",
            text: `🎯 PENALTY GOAL! ${penaltyScorer.name} converts from the spot!`,
            homeScore,
            awayScore
          });
        } else {
          timeline.push({
            minute,
            type: "PENALTY_MISS",
            team: isHomeEvent ? "home" : "away",
            text: `❌ MISSED PENALTY! ${penaltyScorer.name} fires wide!`
          });
        }
      }
    }
  }

  return { timeline, finalHome: homeScore, finalAway: awayScore };
}

/**
 * Simulates Penalty Shootout for Knockout Matches
 */
export function simulatePenaltyShootout(homeSquad, awaySquad) {
  const shootout = [];
  let homeGoals = 0;
  let awayGoals = 0;

  for (let round = 1; round <= 5; round++) {
    const homeShooter = homeSquad[(round - 1) % homeSquad.length];
    const awayShooter = awaySquad[(round - 1) % awaySquad.length];

    const homeSuccess = Math.random() < 0.75;
    if (homeSuccess) homeGoals++;
    shootout.push({ round, team: "home", player: homeShooter.name, success: homeSuccess, currentScore: `${homeGoals}-${awayGoals}` });

    const awaySuccess = Math.random() < 0.72;
    if (awaySuccess) awayGoals++;
    shootout.push({ round, team: "away", player: awayShooter.name, success: awaySuccess, currentScore: `${homeGoals}-${awayGoals}` });
  }

  // Sudden Death if tied
  let suddenRound = 6;
  while (homeGoals === awayGoals && suddenRound <= 10) {
    const homeShooter = homeSquad[(suddenRound - 1) % homeSquad.length];
    const awayShooter = awaySquad[(suddenRound - 1) % awaySquad.length];

    const hSucc = Math.random() < 0.65;
    const aSucc = Math.random() < 0.65;

    if (hSucc) homeGoals++;
    if (aSucc) awayGoals++;

    shootout.push({ round: suddenRound, team: "home", player: homeShooter.name, success: hSucc, currentScore: `${homeGoals}-${awayGoals}` });
    shootout.push({ round: suddenRound, team: "away", player: awayShooter.name, success: aSucc, currentScore: `${homeGoals}-${awayGoals}` });
    suddenRound++;
  }

  return { shootout, homePenalties: homeGoals, awayPenalties: awayGoals };
}

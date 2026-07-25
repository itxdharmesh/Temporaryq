// FICTIONAL NAMES DATABASE FOR APEX LEAGUE UNIVERSE
const FIRST_NAMES = [
  "Kian", "Leo", "Marco", "Aariz", "Dante", "Nico", "Javier", "Viktor", "Mateo", "Soren",
  "Tariq", "Elian", "Lucas", "Zane", "Cyrus", "Hugo", "Jax", "Rayan", "Stefan", "Enzo",
  "Damian", "Felix", "Orion", "Kenji", "Milo", "Gael", "Ren", "Xander", "Luka", "Kai"
];

const LAST_NAMES = [
  "Vega", "Moretti", "Vieri", "Cross", "Khan", "Sterling", "Valdez", "Novak", "Silva", "Kovac",
  "Al-Mansoor", "Torres", "Vance", "Davenport", "Rios", "Lindqvist", "Mercer", "Chen", "Soto", "Dubois",
  "Fontaine", "Gomez", "Kassovitz", "O'Connor", "Takahashi", "Ibrahim", "Russo", "Montero", "Solis", "Vargas"
];

const NATIONALITIES = [
  "🇲🇽 Mexico", "🇧🇷 Brazil", "🇦🇷 Argentina", "🇪🇸 Spain", "🇫🇷 France", "🇮🇹 Italy", 
  "🇩🇪 Germany", "🇳🇬 Nigeria", "🇯🇵 Japan", "🇬🇧 England", "🇳🇱 Netherlands", "🇦🇺 Australia"
];

const POSITIONS = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"];

/**
 * Calculates Card Category / Rarity based on Overall Rating
 */
export function getRarity(ovr) {
  if (ovr >= 89) return { name: "Legend", class: "rarity-legend" };
  if (ovr >= 82) return { name: "Elite", class: "rarity-elite" };
  if (ovr >= 75) return { name: "Gold", class: "rarity-gold" };
  if (ovr >= 65) return { name: "Silver", class: "rarity-silver" };
  return { name: "Bronze", class: "rarity-bronze" };
}

/**
 * Calculates dynamic player market value based on OVR, Age, Potential & Position
 */
export function calculatePlayerValue(ovr, age, potential) {
  const baseFactor = Math.pow(1.18, ovr - 50) * 1200;
  const ageMultiplier = age <= 21 ? 1.35 : age <= 27 ? 1.15 : age <= 31 ? 0.9 : 0.65;
  const potentialMultiplier = 1 + ((potential - ovr) * 0.04);
  
  const calculated = Math.round(baseFactor * ageMultiplier * potentialMultiplier / 100) * 100;
  return Math.max(5000, calculated);
}

/**
 * Calculates player salary per match
 */
export function calculatePlayerSalary(ovr) {
  return Math.round((Math.pow(1.15, ovr - 50) * 150) / 10) * 10;
}

/**
 * Generate a single fictional player with balanced attributes
 */
export function generateFictionalPlayer(id, targetOvr = null) {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const name = `${firstName} ${lastName}`;
  const nationality = NATIONALITIES[Math.floor(Math.random() * NATIONALITIES.length)];
  const position = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
  const age = Math.floor(Math.random() * 18) + 17; // 17 - 34

  const ovr = targetOvr || Math.floor(Math.random() * 38) + 55; // 55 - 92
  const potential = Math.min(95, ovr + Math.floor(Math.random() * 12));

  // Generate stats variance around OVR
  const statVariance = () => Math.min(99, Math.max(35, ovr + Math.floor(Math.random() * 16) - 8));

  const pac = statVariance();
  const sho = statVariance();
  const pas = statVariance();
  const dri = statVariance();
  const def = position.includes("B") || position === "CDM" ? Math.min(99, ovr + 6) : statVariance();
  const phy = statVariance();

  const value = calculatePlayerValue(ovr, age, potential);
  const salary = calculatePlayerSalary(ovr);

  // Generates consistent stylized avatar URL using RoboHash
  const avatarUrl = `https://robohash.org/${encodeURIComponent(name)}?set=set5&bgset=bg2`;

  return {
    id: id || `PLY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name,
    nationality,
    age,
    position,
    ovr,
    potential,
    pac, sho, pas, dri, def, phy,
    value,
    salary,
    avatarUrl,
    rarity: getRarity(ovr),
    contract: Math.floor(Math.random() * 3) + 2, // 2-4 seasons
    fitness: 100,
    morale: 85,
    form: "Good"
  };
}

/**
 * Generates an initial pool of players for the Transfer Market
 */
export function generateMarketPool(count = 20) {
  const pool = [];
  for (let i = 0; i < count; i++) {
    // Distribute ratings: 40% Bronze, 35% Silver, 20% Gold, 5% Elite/Legend
    const rand = Math.random();
    let targetOvr;
    if (rand < 0.40) targetOvr = Math.floor(Math.random() * 10) + 55;      // 55-64
    else if (rand < 0.75) targetOvr = Math.floor(Math.random() * 10) + 65; // 65-74
    else if (rand < 0.95) targetOvr = Math.floor(Math.random() * 7) + 75;  // 75-81
    else targetOvr = Math.floor(Math.random() * 8) + 82;                  // 82-89

    pool.push(generateFictionalPlayer(`MKT-${Date.now()}-${i}`, targetOvr));
  }
  return pool;
}

/**
 * Generates a standard balanced starting squad (11 players) for new clubs
 */
export function generateStarterSquad() {
  const squadPositions = ["GK", "CB", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"];
  return squadPositions.map((pos, index) => {
    // Starter squad players range from 58 to 68 OVR
    const player = generateFictionalPlayer(`STR-${Date.now()}-${index}`, Math.floor(Math.random() * 11) + 58);
    player.position = pos;
    return player;
  });
}

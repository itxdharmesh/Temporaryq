// Comprehensive list of blocked real-world football clubs
const BLOCKED_REAL_CLUBS = [
  "real madrid", "barcelona", "fc barcelona", "manchester united", "manchester city",
  "liverpool", "chelsea", "arsenal", "tottenham", "tottenham hotspur", "bayern munich",
  "bayern munchen", "borussia dortmund", "dortmund", "paris saint-germain", "psg",
  "juventus", "inter milan", "ac milan", "milan", "atletico madrid", "napoli",
  "roma", "lazio", "ajax", "benfica", "porto", "sporting cp", "celtic", "rangers",
  "al nassr", "al hilal", "inter miami", "la galaxy", "boca juniors", "river plate",
  "flamengo", "palmeiras", "santos", "sao paulo"
];

export function validateClubName(name) {
  if (!name || name.trim().length < 3) {
    return { valid: false, message: "Club name must be at least 3 characters long." };
  }

  const cleanInput = name.trim().toLowerCase();

  // Exact match or substring check for real clubs
  const isRealClub = BLOCKED_REAL_CLUBS.some(realClub => {
    return cleanInput === realClub || cleanInput.includes(realClub);
  });

  if (isRealClub) {
    return { 
      valid: false, 
      message: `"${name}" is a real-world club. Please enter an original fictional club name.` 
    };
  }

  return { valid: true };
}
1

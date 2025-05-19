/**
 * Game Theory Implementation for Dating App Scoring
 * 
 * This implements a scoring system based on game theory principles:
 * - Players (users) aim to maximize their matches while being selective
 * - The scoring system incentivizes thoughtful choices by:
 *   1. Creating a limited resource (daily credits)
 *   2. Giving diminishing returns to popular profiles
 *   3. Balancing the matching ecosystem through score adjustments
 */

/**
 * Calculate new score for a profile based on game theory principles
 * 
 * The key mechanisms are:
 * 1. Diminishing returns for high-scored profiles getting likes
 * 2. Smaller penalties for low-scored profiles getting dislikes
 * 3. Bounded score range (0-100)
 * 
 * @param currentScore The profile's current score (0-100)
 * @param isLiked Whether the profile was liked (true) or disliked (false)
 * @returns The new score value
 */
export function calculateNewScore(currentScore: number, isLiked: boolean): number {
  // Normalize score to 0-100 range for safety
  const normalizedScore = Math.max(0, Math.min(100, currentScore));
  
  if (isLiked) {
    // For likes: diminishing returns as score increases
    // The higher the score, the smaller the increment
    // Score boost range: 0.5 to 3.0 points
    const boost = Math.max(0.5, 3 * (1 - (normalizedScore / 100)));
    return Math.min(100, normalizedScore + boost);
  } else {
    // For dislikes: smaller penalties for lower scores
    // Penalty range: 0.3 to 2.0 points
    const penalty = Math.max(0.3, 2 * (normalizedScore / 100));
    return Math.max(0, normalizedScore - penalty);
  }
}

/**
 * Calculate probability of a profile being shown based on its score
 * 
 * This function implements the suppression mechanism for highly-scored profiles,
 * making the app more balanced by giving lower-scored profiles more visibility.
 * 
 * @param score The profile's score (0-100)
 * @returns A probability value between 0-1 for showing this profile
 */
export function calculateShowProbability(score: number): number {
  // Baseline probability starts at 80%
  const baseline = 0.8;
  
  // Score adjustment factor: reduces probability as score increases
  // This creates a soft cap on very high-scored profiles
  const scoreFactor = Math.pow(score / 100, 2) * 0.6;
  
  // The resulting probability will be between 20% and 80%
  // Profiles with score 0 have 80% probability
  // Profiles with score 100 have 20% probability
  return Math.max(0.2, baseline - scoreFactor);
}

/**
 * Calculate optimal credit spending strategy based on remaining credits and days
 * 
 * This helper function can guide users on optimal credit spending strategies
 * 
 * @param remainingCredits Number of credits left today
 * @param daysInCycle Total days in the current cycle
 * @returns A recommendation object with spending advice
 */
export function getCreditSpendingStrategy(remainingCredits: number, daysInCycle: number = 1): {
  optimal: number;
  recommendation: string;
} {
  // Calculate optimal daily spending
  const optimal = Math.ceil(remainingCredits / daysInCycle);
  
  let recommendation = "";
  
  if (remainingCredits <= 2) {
    recommendation = "Use your remaining credits selectively";
  } else if (remainingCredits <= 5) {
    recommendation = "Be more selective with your likes";
  } else {
    recommendation = "You have plenty of credits to spend";
  }
  
  return { optimal, recommendation };
}

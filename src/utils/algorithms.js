/**
 * Calculates Estimated 1-Rep Max (e1RM) using Epley's formula:
 * e1RM = w * (1 + r / 30)
 * For bodyweight exercises where w = 0, e1RM can track max reps directly.
 * @param {number} weight - Weight lifted in kg
 * @param {number} reps - Repetitions performed
 * @param {boolean} isRepBased - If true, return reps directly as the progression metric
 * @returns {number} Estimated 1-Rep Max or reps
 */
export function calculateE1RM(weight, reps, isRepBased = false) {
  if (isRepBased) return reps || 0;
  if (!weight || !reps) return 0;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Maps intuitive exertion ratings to Reps in Reserve (RIR)
 * @param {string} exertion - User feedback string
 * @returns {number} Reps in Reserve
 */
export function mapExertionToRIR(exertion) {
  switch (exertion) {
    case 'CANT_DO_MORE': // "Couldn't do a single more rep"
      return 0;
    case 'HARD_1_2_LEFT': // "Hard, maybe 1 or 2 left in the tank"
      return 1.5; // Represents the 1-2 RIR range
    case 'COMFORTABLE_3_4_LEFT': // "Comfortable, could do 3-4 more reps"
      return 3.5; // Represents the 3-4 RIR range
    default:
      return 2;
  }
}

/**
 * Suggests volume adjustments based on RIR tracking for progressive overload
 * (Based on RP Hypertrophy and JuggernautAI autoregulation principles)
 * 
 * - If RIR is 3-4 (low fatigue, under-stimulated): INCREASE volume (add sets/reps)
 * - If RIR is 1-2 (ideal hypertrophy stimulus): HOLD volume (keep sets, increase weight slightly for progressive overload)
 * - If RIR is 0 (very high fatigue/failure reached): DECREASE volume (reduce sets, or prepare for deload)
 * 
 * @param {number} avgRir - Average Reps in Reserve
 * @param {boolean} feelsExtraFatigued - User self-reported fatigue level
 * @returns {{volumeChange: string, reason: string}}
 */
export function determineVolumeAdjustment(avgRir, feelsExtraFatigued = false) {
  if (feelsExtraFatigued && avgRir <= 1) {
    return {
      volumeChange: 'DECREASE',
      reason: 'User reports high localized fatigue and hit absolute failure (0 RIR). Recommending volume reduction to prevent overreaching.'
    };
  }

  if (avgRir >= 3.0) {
    return {
      volumeChange: 'INCREASE',
      reason: 'Exertion indicates under-stimulation (RIR 3-4). Increasing volume to drive progressive overload stimulus.'
    };
  } else if (avgRir >= 1.0 && avgRir < 3.0) {
    return {
      volumeChange: 'HOLD',
      reason: 'Training is within the ideal hypertrophy zone (RIR 1-2). Holding set volume and focusing on incremental weight progression.'
    };
  } else {
    // avgRir is 0
    return {
      volumeChange: 'HOLD',
      reason: 'Failure reached (RIR 0). Maintaining volume while adapting, monitoring fatigue for potential upcoming deload.'
    };
  }
}

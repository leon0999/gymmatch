/**
 * GymMatch - Matching Algorithm (100-Point System)
 *
 * Core matching logic that scores potential gym partners based on:
 * 1. Distance (30 points) - Proximity is king
 * 2. Schedule Overlap (25 points) - Can they actually work out together?
 * 3. Workout Style (20 points) - Similar training preferences
 * 4. Fitness Level (15 points) - Compatibility in ability
 * 5. Goals Alignment (10 points) - Shared fitness objectives
 */

import type {
  UserProfile,
  Match,
  MatchScore,
  DaySchedule,
  TimeSlot,
} from './types';
import {
  MATCH_WEIGHTS,
  DISTANCE_SCORING,
  MINIMUM_MATCH_SCORE,
} from './constants';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in miles
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert time string to minutes since midnight
 * "09:30" => 570
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if two time slots overlap
 */
function timeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  const start1 = timeToMinutes(slot1.start);
  const end1 = timeToMinutes(slot1.end);
  const start2 = timeToMinutes(slot2.start);
  const end2 = timeToMinutes(slot2.end);

  return start1 < end2 && start2 < end1;
}

/**
 * Calculate overlap duration in minutes
 */
function calculateOverlapDuration(slot1: TimeSlot, slot2: TimeSlot): number {
  const start1 = timeToMinutes(slot1.start);
  const end1 = timeToMinutes(slot1.end);
  const start2 = timeToMinutes(slot2.start);
  const end2 = timeToMinutes(slot2.end);

  if (start1 >= end2 || start2 >= end1) return 0;

  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);

  return overlapEnd - overlapStart;
}

// ============================================================================
// SCORING FUNCTIONS (Each returns 0-X points based on MATCH_WEIGHTS)
// ============================================================================

/**
 * Score based on distance (0-30 points)
 *
 * Scoring:
 * - Within 1 mile: 30 points (EXCELLENT)
 * - Within 3 miles: 20 points (GOOD)
 * - Within 5 miles: 10 points (FAIR)
 * - Within 10 miles: 5 points (POOR)
 * - Beyond 10 miles: 0 points
 */
function scoreDistance(distanceMiles: number): number {
  if (distanceMiles <= DISTANCE_SCORING.EXCELLENT.max) {
    return DISTANCE_SCORING.EXCELLENT.points;
  }
  if (distanceMiles <= DISTANCE_SCORING.GOOD.max) {
    return DISTANCE_SCORING.GOOD.points;
  }
  if (distanceMiles <= DISTANCE_SCORING.FAIR.max) {
    return DISTANCE_SCORING.FAIR.points;
  }
  if (distanceMiles <= DISTANCE_SCORING.POOR.max) {
    return DISTANCE_SCORING.POOR.points;
  }
  return 0;
}

/**
 * Score based on schedule overlap (0-25 points)
 *
 * Calculate total overlap across all days and convert to score
 * - High overlap (10+ hours/week): 25 points
 * - Good overlap (5-10 hours/week): 18 points
 * - Fair overlap (2-5 hours/week): 10 points
 * - Low overlap (<2 hours/week): 5 points
 */
function scoreSchedule(
  schedule1: DaySchedule,
  schedule2: DaySchedule
): { score: number; overlapPercentage: number; totalMinutes: number } {
  let totalOverlapMinutes = 0;

  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ] as const;

  // Calculate overlap for each day
  for (const day of days) {
    const slots1 = schedule1[day] || [];
    const slots2 = schedule2[day] || [];

    for (const slot1 of slots1) {
      for (const slot2 of slots2) {
        totalOverlapMinutes += calculateOverlapDuration(slot1, slot2);
      }
    }
  }

  const totalHours = totalOverlapMinutes / 60;
  let score = 0;

  if (totalHours >= 10) score = 25;
  else if (totalHours >= 5) score = 18;
  else if (totalHours >= 2) score = 10;
  else if (totalHours >= 1) score = 5;

  // Calculate percentage of schedule that overlaps
  const overlapPercentage = Math.min(100, (totalHours / 20) * 100); // Assume 20 hours/week is max

  return {
    score: Math.round(score),
    overlapPercentage: Math.round(overlapPercentage),
    totalMinutes: totalOverlapMinutes,
  };
}

/**
 * Score based on workout style match (0-20 points)
 *
 * Calculate percentage of shared workout styles
 * - 100% match: 20 points
 * - 75% match: 15 points
 * - 50% match: 10 points
 * - 25% match: 5 points
 */
function scoreWorkoutStyle(
  styles1: string[],
  styles2: string[]
): { score: number; mutualStyles: string[] } {
  const mutualStyles = styles1.filter((style) => styles2.includes(style));
  const matchPercentage = mutualStyles.length / Math.max(styles1.length, 1);

  let score = 0;
  if (matchPercentage >= 0.75) score = 20;
  else if (matchPercentage >= 0.5) score = 15;
  else if (matchPercentage >= 0.33) score = 10;
  else if (matchPercentage >= 0.25) score = 5;

  return {
    score: Math.round(score),
    mutualStyles,
  };
}

/**
 * Score based on fitness level (0-15 points)
 *
 * - Same level: 15 points (perfect match)
 * - One level apart: 8 points (e.g., beginner + intermediate)
 * - Two levels apart: 3 points (e.g., beginner + advanced)
 */
function scoreFitnessLevel(level1: string, level2: string): number {
  const levels = ['beginner', 'intermediate', 'advanced'];
  const index1 = levels.indexOf(level1);
  const index2 = levels.indexOf(level2);

  const difference = Math.abs(index1 - index2);

  if (difference === 0) return 15;
  if (difference === 1) return 8;
  return 3;
}

/**
 * Score based on goal alignment (0-10 points)
 *
 * Calculate percentage of shared fitness goals
 * - 100% match: 10 points
 * - 50%+ match: 7 points
 * - 25%+ match: 4 points
 * - Any match: 2 points
 */
function scoreGoals(
  goals1: string[],
  goals2: string[]
): { score: number; mutualGoals: string[] } {
  const mutualGoals = goals1.filter((goal) => goals2.includes(goal));
  const matchPercentage = mutualGoals.length / Math.max(goals1.length, 1);

  let score = 0;
  if (matchPercentage >= 1.0) score = 10;
  else if (matchPercentage >= 0.5) score = 7;
  else if (matchPercentage >= 0.25) score = 4;
  else if (mutualGoals.length > 0) score = 2;

  return {
    score: Math.round(score),
    mutualGoals,
  };
}

// ============================================================================
// MAIN MATCHING ALGORITHM
// ============================================================================

/**
 * Calculate match score between two users
 *
 * Returns a Match object with total score (0-100) and detailed breakdown
 */
export function calculateMatchScore(
  currentUser: UserProfile,
  targetUser: UserProfile
): Match {
  // 1. Calculate distance
  const distance = calculateDistance(
    currentUser.basics.location.lat,
    currentUser.basics.location.lng,
    targetUser.basics.location.lat,
    targetUser.basics.location.lng
  );

  // 2. Score each component
  const distanceScore = scoreDistance(distance);

  const scheduleResult = scoreSchedule(
    currentUser.fitness.schedule,
    targetUser.fitness.schedule
  );

  const styleResult = scoreWorkoutStyle(
    currentUser.fitness.styles,
    targetUser.fitness.styles
  );

  const levelScore = scoreFitnessLevel(
    currentUser.fitness.level,
    targetUser.fitness.level
  );

  const goalsResult = scoreGoals(
    currentUser.fitness.goals,
    targetUser.fitness.goals
  );

  // 3. Calculate total score
  const totalScore =
    distanceScore +
    scheduleResult.score +
    styleResult.score +
    levelScore +
    goalsResult.score;

  // 4. Build match object
  const match: Match = {
    id: targetUser.id,
    profile: targetUser,
    score: {
      total: Math.round(totalScore),
      breakdown: {
        distance: distanceScore,
        schedule: scheduleResult.score,
        style: styleResult.score,
        level: levelScore,
        goals: goalsResult.score,
      },
    },
    distance: distance,
    scheduleOverlap: scheduleResult.overlapPercentage / 100,
    mutualGoals: goalsResult.mutualGoals,
    mutualStyles: styleResult.mutualStyles,
    isOnline: isUserOnline(targetUser.lastActive),
    lastActiveMinutes: getLastActiveMinutes(targetUser.lastActive),
  };

  return match;
}

/**
 * Filter and rank potential matches for a user
 *
 * Returns array of Match objects sorted by score (highest first)
 */
export function findMatches(
  currentUser: UserProfile,
  potentialMatches: UserProfile[]
): Match[] {
  // 1. Filter by user preferences
  const filtered = potentialMatches.filter((user) => {
    // Age range
    if (
      user.basics.age < currentUser.preferences.ageRange[0] ||
      user.basics.age > currentUser.preferences.ageRange[1]
    ) {
      return false;
    }

    // Gender preference
    if (currentUser.preferences.partnerGender === 'same') {
      if (user.basics.gender !== currentUser.basics.gender) return false;
    } else if (currentUser.preferences.partnerGender === 'opposite') {
      if (user.basics.gender === currentUser.basics.gender) return false;
    }

    // Distance
    const distance = calculateDistance(
      currentUser.basics.location.lat,
      currentUser.basics.location.lng,
      user.basics.location.lat,
      user.basics.location.lng
    );
    if (distance > currentUser.preferences.maxDistance) return false;

    return true;
  });

  // 2. Calculate match scores
  const matches = filtered.map((user) => calculateMatchScore(currentUser, user));

  // 3. Filter by minimum score
  const minScore = currentUser.preferences.minMatchScore || MINIMUM_MATCH_SCORE;
  const qualifiedMatches = matches.filter((match) => match.score.total >= minScore);

  // 4. Sort by score (highest first)
  qualifiedMatches.sort((a, b) => b.score.total - a.score.total);

  return qualifiedMatches;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user was active in the last 5 minutes
 */
function isUserOnline(lastActive: Date): boolean {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return new Date(lastActive) > fiveMinutesAgo;
}

/**
 * Get minutes since last active
 */
function getLastActiveMinutes(lastActive: Date): number {
  const diff = Date.now() - new Date(lastActive).getTime();
  return Math.floor(diff / 60000);
}

/**
 * Get color class for match score (for UI)
 */
export function getMatchScoreColor(score: number): string {
  if (score >= 85) return 'text-green-600'; // Excellent
  if (score >= 70) return 'text-blue-600'; // Great
  if (score >= 55) return 'text-yellow-600'; // Good
  return 'text-gray-600'; // Fair
}

/**
 * Get badge text for match score (for UI)
 */
export function getMatchScoreBadge(score: number): string {
  if (score >= 85) return 'Excellent Match';
  if (score >= 70) return 'Great Match';
  if (score >= 55) return 'Good Match';
  return 'Fair Match';
}

/**
 * Calculate compatibility percentage (simplified for users)
 */
export function getCompatibilityPercentage(match: Match): number {
  return match.score.total;
}

// ============================================================================
// ADVANCED FILTERS (Premium Feature)
// ============================================================================

/**
 * Filter matches by gym chain (Premium feature)
 */
export function filterByGym(matches: Match[], gymName: string): Match[] {
  return matches.filter(
    (match) =>
      match.profile.basics.gym?.toLowerCase().includes(gymName.toLowerCase()) ||
      match.profile.basics.gymChain?.toLowerCase().includes(gymName.toLowerCase())
  );
}

/**
 * Filter matches by specific workout style (Premium feature)
 */
export function filterByWorkoutStyle(matches: Match[], style: string): Match[] {
  return matches.filter((match) =>
    match.profile.fitness.styles.includes(style)
  );
}

/**
 * Filter matches by verified status (Premium feature)
 */
export function filterByVerified(matches: Match[]): Match[] {
  return matches.filter((match) => match.profile.social.verified);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  calculateDistance,
  scoreDistance,
  scoreSchedule,
  scoreWorkoutStyle,
  scoreFitnessLevel,
  scoreGoals,
};

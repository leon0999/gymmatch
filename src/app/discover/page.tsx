'use client';

/**
 * GymMatch - Discover Page (MVP Version)
 *
 * Sexy swipeable matching interface with:
 * - Smooth swipe animations (Framer Motion)
 * - Instagram story style cards
 * - Workout-specific information
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import MatchModal from '@/components/MatchModal';
import BottomNav from '@/components/BottomNav';
import DiscoverFilters, { DiscoverFilterOptions } from '@/components/DiscoverFilters';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface MatchWithScore extends Profile {
  matchScore: number;
  distance: number;
  matchReasons: string[];
}

export default function DiscoverPageV2() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [matches, setMatches] = useState<MatchWithScore[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState<Profile | null>(null);
  const [newMatchId, setNewMatchId] = useState<string | null>(null);
  const [filters, setFilters] = useState<DiscoverFilterOptions>({
    workoutParts: [],
    strengthLevels: [],
  });

  // Swipe animation values (must be at top level)
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const likeScale = useTransform(x, [0, 100], [0.8, 1.2]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const nopeScale = useTransform(x, [-100, 0], [1.2, 0.8]);

  useEffect(() => {
    loadMatches();
  }, [filters]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/onboarding');
        return;
      }

      // Get current user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        setError('Could not load your profile');
        return;
      }

      setCurrentUser(profile);

      // Get users already liked or passed
      const { data: likedUsers } = await supabase
        .from('likes')
        .select('to_user_id')
        .eq('from_user_id', user.id);

      const likedUserIds = new Set(
        (likedUsers || []).map((s) => s.to_user_id)
      );

      // Get all other profiles (excluding self and already liked)
      const { data: allProfiles, error: matchError } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .limit(50);

      console.log('🔍 All profiles:', allProfiles?.length);

      if (matchError) {
        console.error('❌ Match error:', matchError);
        setError('Could not load matches');
        return;
      }

      // Filter out already liked users
      const unseenProfiles = (allProfiles || []).filter(
        (p) => !likedUserIds.has(p.user_id)
      );

      console.log('🔍 Unseen profiles (not liked yet):', unseenProfiles.length);

      // Apply preference filters
      const filteredProfiles = unseenProfiles.filter((match) => {
        // Gender filter (use preferred_gender, not partner_gender)
        if (profile.preferred_gender && profile.preferred_gender !== 'any' && match.gender !== profile.preferred_gender) {
          console.log(`❌ Gender filter: ${match.name} (${match.gender}) doesn't match ${profile.preferred_gender}`);
          return false;
        }

        // Workout parts filter
        if (filters.workoutParts.length > 0) {
          const hasCommonWorkoutPart = filters.workoutParts.some(part =>
            match.favorite_workout_parts?.includes(part)
          );
          if (!hasCommonWorkoutPart) {
            return false;
          }
        }

        // Strength level filter
        if (filters.strengthLevels.length > 0) {
          if (!match.strength_level || !filters.strengthLevels.includes(match.strength_level)) {
            return false;
          }
        }

        // Age range filter
        if (filters.minAge && match.age < filters.minAge) {
          return false;
        }
        if (filters.maxAge && match.age > filters.maxAge) {
          return false;
        }

        // Age filter
        if (profile.age_range && profile.age_range.length === 2) {
          const [minAge, maxAge] = profile.age_range;
          if (match.age < minAge || match.age > maxAge) {
            return false;
          }
        }

        // Distance filter (simplified: same city check)
        if (profile.max_distance && profile.max_distance < 10) {
          // If max_distance < 10 miles, require same city
          if (profile.location_name?.toLowerCase() !== match.location_name?.toLowerCase()) {
            return false;
          }
        }

        return true;
      });

      console.log('🔍 Filtered profiles (after preference filters):', filteredProfiles.length);

      if (filteredProfiles.length === 0) {
        console.warn('⚠️ No profiles match your preferences!');
      }

      // Calculate match scores (improved algorithm)
      const scored = filteredProfiles.map((match) => ({
        ...match,
        matchScore: calculateImprovedScore(profile, match),
        distance: calculateSimpleDistance(profile, match),
        matchReasons: getMatchReasons(profile, match),
      }));

      // Sort by score
      scored.sort((a, b) => b.matchScore - a.matchScore);

      console.log('✅ Final matches:', scored.length);
      setMatches(scored);
    } catch (err: any) {
      console.error('Error loading matches:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const calculateImprovedScore = (user: Profile, match: Profile): number => {
    let score = 0;

    // 1. Location compatibility (0-25 points)
    if (user.location_name?.toLowerCase() === match.location_name?.toLowerCase()) {
      score += 25; // Same city is very important
    } else {
      score += 5; // Different city but still possible
    }

    // 2. Fitness level compatibility (0-20 points)
    if (user.fitness_level === match.fitness_level) {
      score += 20; // Perfect match
    } else {
      // Adjacent levels get partial points
      const levels = ['beginner', 'intermediate', 'advanced'];
      const userLevel = levels.indexOf(user.fitness_level || 'beginner');
      const matchLevel = levels.indexOf(match.fitness_level || 'beginner');
      const diff = Math.abs(userLevel - matchLevel);
      if (diff === 1) score += 10; // One level apart
      // 2+ levels apart: 0 points
    }

    // 3. Fitness goals overlap (0-20 points)
    const commonGoals = user.fitness_goals?.filter((g) =>
      match.fitness_goals?.includes(g)
    ) || [];
    if (commonGoals.length > 0) {
      score += Math.min(20, commonGoals.length * 7); // Up to 20 points
    }

    // 4. Workout styles overlap (0-20 points)
    const commonStyles = user.workout_styles?.filter((s) =>
      match.workout_styles?.includes(s)
    ) || [];
    if (commonStyles.length > 0) {
      score += Math.min(20, commonStyles.length * 7); // Up to 20 points
    }

    // 5. Same gym (0-15 points) - HUGE bonus!
    if (user.gym && match.gym && user.gym.toLowerCase() === match.gym.toLowerCase()) {
      score += 15;
    }

    return Math.min(100, Math.round(score));
  };

  const calculateSimpleDistance = (user: Profile, match: Profile): number => {
    // MVP: Same city = 1 mile, different = 5 miles
    if (user.location_name?.toLowerCase() === match.location_name?.toLowerCase()) {
      return 1;
    }
    return 5;
  };

  const getMatchReasons = (user: Profile, match: Profile): string[] => {
    const reasons: string[] = [];

    // Same gym is the strongest signal
    if (user.gym && match.gym && user.gym.toLowerCase() === match.gym.toLowerCase()) {
      reasons.push(`🏢 Same gym: ${match.gym}`);
    }

    // Same city
    if (user.location_name?.toLowerCase() === match.location_name?.toLowerCase()) {
      reasons.push(`📍 Both in ${match.location_name}`);
    }

    // Fitness level
    if (user.fitness_level === match.fitness_level) {
      reasons.push(`💪 Both ${match.fitness_level} level`);
    } else {
      const levels = ['beginner', 'intermediate', 'advanced'];
      const userLevel = levels.indexOf(user.fitness_level || 'beginner');
      const matchLevel = levels.indexOf(match.fitness_level || 'beginner');
      const diff = Math.abs(userLevel - matchLevel);
      if (diff === 1) {
        reasons.push(`💪 Compatible fitness levels`);
      }
    }

    // Common goals
    const commonGoals = user.fitness_goals?.filter((g) =>
      match.fitness_goals?.includes(g)
    ) || [];
    if (commonGoals.length >= 2) {
      reasons.push(`🎯 ${commonGoals.length} shared goals`);
    } else if (commonGoals.length === 1) {
      reasons.push(`🎯 ${commonGoals[0].replace('_', ' ')}`);
    }

    // Common workout styles
    const commonStyles = user.workout_styles?.filter((s) =>
      match.workout_styles?.includes(s)
    ) || [];
    if (commonStyles.length >= 2) {
      reasons.push(`🏋️ ${commonStyles.length} shared workout styles`);
    } else if (commonStyles.length === 1) {
      reasons.push(`🏋️ Both enjoy ${commonStyles[0]}`);
    }

    return reasons.slice(0, 4); // Show up to 4 reasons
  };

  const handleLike = async () => {
    if (!currentUser || currentIndex >= matches.length) return;

    const match = matches[currentIndex];

    try {
      // Record like in database
      const { error } = await supabase.from('likes').insert({
        from_user_id: currentUser.user_id,
        to_user_id: match.user_id,
      });

      if (error) {
        console.error('Error recording like:', error);
      } else {
        console.log('✅ Liked:', match.name);

        // Check for mutual match
        await checkMutualMatch(currentUser.user_id, match.user_id);
      }
    } catch (err) {
      console.error('Error in handleLike:', err);
    }

    // Move to next
    setCurrentIndex(currentIndex + 1);
  };

  const handlePass = async () => {
    if (!currentUser || currentIndex >= matches.length) return;

    const match = matches[currentIndex];

    try {
      // Just skip - no database record for passes
      console.log('❌ Passed:', match.name);
    } catch (err) {
      console.error('Error in handlePass:', err);
    }

    // Move to next
    setCurrentIndex(currentIndex + 1);
  };

  const handleDragEnd = (_: any, info: any) => {
    const swipeThreshold = 100;

    if (info.offset.x > swipeThreshold) {
      // Swiped right - Like
      handleLike();
    } else if (info.offset.x < -swipeThreshold) {
      // Swiped left - Pass
      handlePass();
    }
  };

  const checkMutualMatch = async (userId: string, targetUserId: string) => {
    try {
      // Check if target user also liked current user
      const { data: mutualLike } = await supabase
        .from('likes')
        .select('*')
        .eq('from_user_id', targetUserId)
        .eq('to_user_id', userId)
        .single();

      if (mutualLike) {
        // Create mutual match (ensure user1_id < user2_id)
        const user1_id = userId < targetUserId ? userId : targetUserId;
        const user2_id = userId < targetUserId ? targetUserId : userId;

        const { data: newMatch, error } = await supabase.from('matches').insert({
          user1_id,
          user2_id,
        }).select().single();

        if (!error && newMatch) {
          console.log('🎉 It\'s a match!');
          // Show match success modal
          setMatchedUser(matches[currentIndex]);
          setNewMatchId(newMatch.id);
          setShowMatchModal(true);
        }
      }
    } catch (err) {
      console.error('Error checking mutual match:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadMatches}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (currentIndex >= matches.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg
              className="w-12 h-12 text-teal-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            All caught up!
          </h2>
          <p className="text-gray-600 mb-2">
            You've seen all available matches in your area.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Check back soon for new gym partners!
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-full hover:from-teal-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Back to Home
            </button>
            <button
              onClick={loadMatches}
              className="w-full px-6 py-3 bg-white text-teal-600 font-semibold rounded-full border-2 border-teal-600 hover:bg-teal-50 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentMatch = matches[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-900">Discover</h1>
            <div className="flex items-center gap-3">
              <DiscoverFilters filters={filters} onFiltersChange={(newFilters) => {
                setFilters(newFilters);
                setCurrentIndex(0);
              }} />
              <div className="text-sm font-medium text-gray-600">
                {currentIndex + 1} of {matches.length}
              </div>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 to-blue-500 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${((currentIndex + 1) / matches.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Match Card - Sexy Instagram Story Style with Swipe */}
        <motion.div
          className="relative rounded-3xl shadow-2xl overflow-hidden mb-6 cursor-grab active:cursor-grabbing"
          style={{
            height: '75vh',
            maxHeight: '650px',
            x,
            rotate,
            opacity,
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {/* Swipe Indicators */}
          <motion.div
            className="absolute top-10 left-10 z-20 pointer-events-none"
            style={{
              opacity: likeOpacity,
              scale: likeScale,
            }}
          >
            <div className="px-6 py-4 bg-green-500 border-4 border-white rounded-2xl shadow-2xl transform rotate-12">
              <span className="text-white text-4xl font-black">LIKE</span>
            </div>
          </motion.div>

          <motion.div
            className="absolute top-10 right-10 z-20 pointer-events-none"
            style={{
              opacity: nopeOpacity,
              scale: nopeScale,
            }}
          >
            <div className="px-6 py-4 bg-red-500 border-4 border-white rounded-2xl shadow-2xl transform -rotate-12">
              <span className="text-white text-4xl font-black">NOPE</span>
            </div>
          </motion.div>

          {/* Background Image */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-blue-500">
            {currentMatch.photo_url ? (
              <img
                src={currentMatch.photo_url}
                alt={currentMatch.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-40 h-40 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-8xl">👤</span>
                </div>
              </div>
            )}
          </div>

          {/* Gradient Overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />

          {/* Top Info - Match Score */}
          <div className="absolute top-6 right-6 z-10">
            <div className={`px-4 py-2 rounded-full backdrop-blur-md bg-white/20 border-2 ${
              currentMatch.matchScore >= 80 ? 'border-green-400' :
              currentMatch.matchScore >= 60 ? 'border-blue-400' :
              'border-yellow-400'
            }`}>
              <div className="text-white text-2xl font-bold">
                {currentMatch.matchScore}%
              </div>
            </div>
          </div>

          {/* Today's Workout Part - BIG BADGE */}
          {currentMatch.today_workout_part && (
            <div className="absolute top-6 left-6 z-10">
              <div className="px-5 py-3 rounded-full backdrop-blur-md bg-teal-500/90 border-2 border-white/50 shadow-xl">
                <div className="text-white font-bold text-lg capitalize flex items-center gap-2">
                  <span className="text-2xl">
                    {currentMatch.today_workout_part === 'chest' && '💪'}
                    {currentMatch.today_workout_part === 'back' && '🦸'}
                    {currentMatch.today_workout_part === 'legs' && '🦵'}
                    {currentMatch.today_workout_part === 'shoulders' && '🤸'}
                    {currentMatch.today_workout_part === 'arms' && '💪'}
                    {currentMatch.today_workout_part === 'core' && '🧘'}
                    {currentMatch.today_workout_part === 'cardio' && '🏃'}
                    {currentMatch.today_workout_part === 'rest' && '😴'}
                  </span>
                  {currentMatch.today_workout_part}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
            {/* Name and Age */}
            <div className="mb-4">
              <h2 className="text-4xl font-black text-white drop-shadow-lg mb-2">
                {currentMatch.name}, {currentMatch.age}
              </h2>
              <div className="flex items-center gap-3 text-white/90 text-sm">
                <span className="flex items-center gap-1">
                  📍 {currentMatch.location_name}
                </span>
                {currentMatch.distance && (
                  <span className="flex items-center gap-1">
                    🚶 {currentMatch.distance} miles
                  </span>
                )}
              </div>
            </div>

            {/* Workout Stats - 3 Big Lifts */}
            {(currentMatch.bench_press_1rm || currentMatch.squat_1rm || currentMatch.deadlift_1rm) && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {currentMatch.bench_press_1rm && (
                  <div className="backdrop-blur-md bg-white/10 rounded-xl p-3 border border-white/20 text-center">
                    <div className="text-2xl mb-1">🏋️</div>
                    <div className="text-white font-bold text-lg">{currentMatch.bench_press_1rm}kg</div>
                    <div className="text-white/70 text-xs">Bench</div>
                  </div>
                )}
                {currentMatch.squat_1rm && (
                  <div className="backdrop-blur-md bg-white/10 rounded-xl p-3 border border-white/20 text-center">
                    <div className="text-2xl mb-1">🦵</div>
                    <div className="text-white font-bold text-lg">{currentMatch.squat_1rm}kg</div>
                    <div className="text-white/70 text-xs">Squat</div>
                  </div>
                )}
                {currentMatch.deadlift_1rm && (
                  <div className="backdrop-blur-md bg-white/10 rounded-xl p-3 border border-white/20 text-center">
                    <div className="text-2xl mb-1">💪</div>
                    <div className="text-white font-bold text-lg">{currentMatch.deadlift_1rm}kg</div>
                    <div className="text-white/70 text-xs">Deadlift</div>
                  </div>
                )}
              </div>
            )}

            {/* Workout Details Row */}
            <div className="flex flex-wrap gap-2 mb-3">
              {/* Current Goal */}
              {currentMatch.current_goal && (
                <div className="px-3 py-1.5 backdrop-blur-md bg-white/15 rounded-full border border-white/30 text-white text-sm font-medium flex items-center gap-1.5">
                  <span>
                    {currentMatch.current_goal === 'bulk' && '💪'}
                    {currentMatch.current_goal === 'cut' && '🔥'}
                    {currentMatch.current_goal === 'maintain' && '⚖️'}
                    {currentMatch.current_goal === 'strength' && '🏋️'}
                    {currentMatch.current_goal === 'endurance' && '🏃'}
                    {currentMatch.current_goal === 'beginner_gains' && '🌱'}
                  </span>
                  <span className="capitalize">{currentMatch.current_goal.replace('_', ' ')}</span>
                </div>
              )}

              {/* Workout Time */}
              {currentMatch.workout_time_preference && (
                <div className="px-3 py-1.5 backdrop-blur-md bg-white/15 rounded-full border border-white/30 text-white text-sm font-medium flex items-center gap-1.5">
                  <span>🕐</span>
                  <span className="capitalize">{currentMatch.workout_time_preference.replace('_', ' ')}</span>
                </div>
              )}

              {/* Experience */}
              {currentMatch.workout_experience_months && (
                <div className="px-3 py-1.5 backdrop-blur-md bg-white/15 rounded-full border border-white/30 text-white text-sm font-medium flex items-center gap-1.5">
                  <span>📅</span>
                  <span>{Math.floor(currentMatch.workout_experience_months / 12)}y {currentMatch.workout_experience_months % 12}m</span>
                </div>
              )}

              {/* Fitness Level */}
              <div className="px-3 py-1.5 backdrop-blur-md bg-white/15 rounded-full border border-white/30 text-white text-sm font-medium flex items-center gap-1.5">
                <span>
                  {currentMatch.fitness_level === 'beginner' && '🌱'}
                  {currentMatch.fitness_level === 'intermediate' && '💪'}
                  {currentMatch.fitness_level === 'advanced' && '🏆'}
                </span>
                <span className="capitalize">{currentMatch.fitness_level}</span>
              </div>
            </div>

            {/* Bio */}
            {currentMatch.bio && (
              <p className="text-white/90 text-sm leading-relaxed mb-3 line-clamp-2">
                {currentMatch.bio}
              </p>
            )}

            {/* Match Reasons */}
            {currentMatch.matchReasons.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currentMatch.matchReasons.slice(0, 3).map((reason, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 backdrop-blur-md bg-teal-500/80 rounded-full text-white text-xs font-medium border border-white/30"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex gap-6 justify-center items-center">
          {/* Pass Button */}
          <button
            onClick={handlePass}
            className="w-16 h-16 bg-white border-4 border-gray-300 rounded-full flex items-center justify-center hover:border-red-400 hover:bg-red-50 hover:scale-110 active:scale-95 transition-all duration-200 group shadow-md"
            aria-label="Pass"
          >
            <svg
              className="w-8 h-8 text-gray-400 group-hover:text-red-500 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Like Button */}
          <button
            onClick={handleLike}
            className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center hover:from-teal-600 hover:to-teal-700 hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl hover:shadow-2xl"
            aria-label="Like"
          >
            <svg
              className="w-10 h-10 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>

          {/* Super Like Button (optional future feature placeholder) */}
          <button
            onClick={handleLike}
            className="w-16 h-16 bg-white border-4 border-blue-300 rounded-full flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 hover:scale-110 active:scale-95 transition-all duration-200 group shadow-md"
            aria-label="Super Like"
          >
            <svg
              className="w-8 h-8 text-blue-400 group-hover:text-blue-600 transition-colors"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </button>
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm font-medium text-gray-700">
            ❤️ Like • ⭐ Super Like • ✕ Pass
          </p>
          <p className="text-xs text-gray-500">
            Tap the buttons or swipe to choose
          </p>
        </div>
      </div>

      {/* Match Success Modal */}
      <MatchModal
        isOpen={showMatchModal}
        matchedUser={matchedUser}
        matchId={newMatchId}
        onClose={() => setShowMatchModal(false)}
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

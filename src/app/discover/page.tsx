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
import TodayWorkoutPopup from '@/components/TodayWorkoutPopup';
import { History } from 'lucide-react';

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
  const [showWorkoutPopup, setShowWorkoutPopup] = useState(false);
  const [todayFocus, setTodayFocus] = useState<string | null>(null);

  // Swipe animation values (must be at top level)
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const likeScale = useTransform(x, [0, 100], [0.8, 1.2]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const nopeScale = useTransform(x, [-100, 0], [1.2, 0.8]);

  useEffect(() => {
    checkTodayWorkoutFocus();
  }, []);

  useEffect(() => {
    if (todayFocus !== null) {
      loadMatches();
    }
  }, [filters, todayFocus]);

  const checkTodayWorkoutFocus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/onboarding');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('today_workout_focus, workout_focus_updated_at')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Check if updated today
      const today = new Date().toDateString();
      const lastUpdated = profile.workout_focus_updated_at
        ? new Date(profile.workout_focus_updated_at).toDateString()
        : null;

      if (!profile.today_workout_focus || lastUpdated !== today) {
        // Show popup to select today's workout focus
        setShowWorkoutPopup(true);
        // Set default to 'any' so loading can start
        setTodayFocus('any');
      } else {
        // Already selected today
        setTodayFocus(profile.today_workout_focus);
      }
    } catch (error) {
      console.error('Failed to check workout focus:', error);
      // Continue without popup
      setTodayFocus('any');
    }
  };

  const loadMatches = async () => {
    console.log('🚀 loadMatches() started');
    try {
      setLoading(true);
      setError(null);

      // Get current user
      console.log('👤 Getting current user...');
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('❌ No user found, redirecting to onboarding');
        router.push('/onboarding');
        return;
      }

      console.log('✅ User found:', user.id);

      // Get current user's profile
      console.log('📋 Fetching user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('❌ Profile error:', profileError);
        setError('Could not load your profile');
        return;
      }

      console.log('✅ Profile loaded:', profile.name);
      setCurrentUser(profile);

      // Get users already liked or passed
      console.log('💚 Fetching liked users...');
      const { data: likedUsers } = await supabase
        .from('likes')
        .select('to_user_id')
        .eq('from_user_id', user.id);

      const likedUserIds = new Set(
        (likedUsers || []).map((s) => s.to_user_id)
      );
      console.log('✅ Liked users:', likedUserIds.size);

      // Get all other profiles (excluding self and already liked)
      console.log('👥 Fetching all other profiles...');
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

      // Calculate match scores using client-side algorithm (225 points max)
      // Note: Using client-side scoring for speed and reliability
      console.log('🔢 Calculating match scores for', filteredProfiles.length, 'profiles...');
      const scored = filteredProfiles.map((match, index) => {
        const matchScore = calculateClientSideScore(profile, match);
        console.log(`  [${index + 1}/${filteredProfiles.length}] ${match.name}: ${matchScore} points`);

        return {
          ...match,
          matchScore,
          distance: calculateSimpleDistance(profile, match),
          matchReasons: getMatchReasons(profile, match),
        };
      });
      console.log('✅ All scores calculated!');

      // Sort by today's workout focus priority + score
      scored.sort((a, b) => {
        // Priority 1: Same today's workout focus (if both selected)
        const aHasSameFocus = todayFocus && todayFocus !== 'any' && a.today_workout_focus === todayFocus;
        const bHasSameFocus = todayFocus && todayFocus !== 'any' && b.today_workout_focus === todayFocus;

        // Check if their focus was updated today
        const today = new Date().toDateString();
        const aUpdatedToday = a.workout_focus_updated_at
          ? new Date(a.workout_focus_updated_at).toDateString() === today
          : false;
        const bUpdatedToday = b.workout_focus_updated_at
          ? new Date(b.workout_focus_updated_at).toDateString() === today
          : false;

        const aMatch = aHasSameFocus && aUpdatedToday;
        const bMatch = bHasSameFocus && bUpdatedToday;

        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;

        // Priority 2: Match score
        return b.matchScore - a.matchScore;
      });

      console.log('✅ Final matches:', scored.length);
      setMatches(scored);
    } catch (err: any) {
      console.error('Error loading matches:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Client-side scoring fallback (when RPC fails)
  const calculateClientSideScore = (user: Profile, match: Profile): number => {
    let score = 0;

    // 1. Same today's workout focus (+50)
    const today = new Date().toDateString();
    const userUpdatedToday = user.workout_focus_updated_at
      ? new Date(user.workout_focus_updated_at).toDateString() === today
      : false;
    const matchUpdatedToday = match.workout_focus_updated_at
      ? new Date(match.workout_focus_updated_at).toDateString() === today
      : false;

    if (user.today_workout_focus && match.today_workout_focus &&
        user.today_workout_focus === match.today_workout_focus &&
        userUpdatedToday && matchUpdatedToday) {
      score += 50;
    }

    // 2. Same workout split (+30)
    if (user.workout_split && match.workout_split && user.workout_split === match.workout_split) {
      score += 30;
    }

    // 3. Similar PRs (+20 each)
    if (user.bench_pr && match.bench_pr && Math.abs(user.bench_pr - match.bench_pr) <= 45) {
      score += 20;
    }
    if (user.squat_pr && match.squat_pr && Math.abs(user.squat_pr - match.squat_pr) <= 45) {
      score += 20;
    }
    if (user.deadlift_pr && match.deadlift_pr && Math.abs(user.deadlift_pr - match.deadlift_pr) <= 45) {
      score += 20;
    }

    // 4. Same gym (+30)
    if (user.gym_name && match.gym_name && user.gym_name === match.gym_name) {
      score += 30;
    }

    // 5. Same preferred time (+15)
    if (user.preferred_time && match.preferred_time && user.preferred_time === match.preferred_time) {
      score += 15;
    }

    // 6. Similar weekly frequency (+10)
    if (user.weekly_frequency && match.weekly_frequency &&
        Math.abs(user.weekly_frequency - match.weekly_frequency) <= 1) {
      score += 10;
    }

    // 7. Same fitness level (+10)
    if (user.fitness_level === match.fitness_level) {
      score += 10;
    }

    // 8. Preferred gender match (+10)
    const userPreferredGender = user.preferred_gender || 'any';
    const matchPreferredGender = match.preferred_gender || 'any';
    if ((userPreferredGender === 'any' || userPreferredGender === match.gender) &&
        (matchPreferredGender === 'any' || matchPreferredGender === user.gender)) {
      score += 10;
    }

    return score;
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

  // Advanced match reasons based on 225-point scoring system
  const getAdvancedMatchReasons = (user: Profile, match: Profile, score: number): string[] => {
    const reasons: string[] = [];

    // 1. Same today's workout focus (+50)
    const today = new Date().toDateString();
    const userUpdatedToday = user.workout_focus_updated_at
      ? new Date(user.workout_focus_updated_at).toDateString() === today
      : false;
    const matchUpdatedToday = match.workout_focus_updated_at
      ? new Date(match.workout_focus_updated_at).toDateString() === today
      : false;

    if (user.today_workout_focus && match.today_workout_focus &&
        user.today_workout_focus === match.today_workout_focus &&
        userUpdatedToday && matchUpdatedToday) {
      const focusLabels: Record<string, string> = {
        chest: 'Chest', back: 'Back', legs: 'Legs',
        shoulders: 'Shoulders', arms: 'Arms', core: 'Core',
        cardio: 'Cardio', any: 'Any',
      };
      reasons.push(`🔥 Training ${focusLabels[match.today_workout_focus] || match.today_workout_focus} TODAY!`);
    }

    // 2. Same workout split (+30)
    if (user.workout_split && match.workout_split && user.workout_split === match.workout_split) {
      reasons.push(`💪 Both run ${match.workout_split}`);
    }

    // 3. Similar PRs (+20 each for Bench, Squat, Deadlift within ±45lbs)
    const prReasons: string[] = [];
    if (user.bench_pr && match.bench_pr && Math.abs(user.bench_pr - match.bench_pr) <= 45) {
      prReasons.push('Bench');
    }
    if (user.squat_pr && match.squat_pr && Math.abs(user.squat_pr - match.squat_pr) <= 45) {
      prReasons.push('Squat');
    }
    if (user.deadlift_pr && match.deadlift_pr && Math.abs(user.deadlift_pr - match.deadlift_pr) <= 45) {
      prReasons.push('Deadlift');
    }
    if (prReasons.length > 0) {
      reasons.push(`🏋️ Similar PRs: ${prReasons.join(', ')}`);
    }

    // 4. Same gym (+30)
    if (user.gym_name && match.gym_name && user.gym_name.toLowerCase() === match.gym_name.toLowerCase()) {
      reasons.push(`🏢 Same gym: ${match.gym_name}`);
    }

    // 5. Same preferred time (+15)
    if (user.preferred_time && match.preferred_time && user.preferred_time === match.preferred_time) {
      reasons.push(`🕐 Both train ${match.preferred_time.replace('_', ' ')}`);
    }

    // 6. Similar weekly frequency (±1) (+10)
    if (user.weekly_frequency && match.weekly_frequency &&
        Math.abs(user.weekly_frequency - match.weekly_frequency) <= 1) {
      reasons.push(`📅 Both train ${match.weekly_frequency}x/week`);
    }

    // 7. Same fitness level (+10)
    if (user.fitness_level === match.fitness_level) {
      reasons.push(`💪 Both ${match.fitness_level} level`);
    }

    // 8. Preferred gender match (+10)
    const userPrefersMatch = user.preferred_gender === 'any' || user.preferred_gender === match.gender;
    const matchPrefersUser = match.preferred_gender === 'any' || match.preferred_gender === user.gender;
    if (userPrefersMatch && matchPrefersUser) {
      // Don't show this as it's expected
    }

    // Add score indicator
    if (score >= 150) {
      reasons.unshift(`⭐ ${score}/225 - Perfect Match!`);
    } else if (score >= 100) {
      reasons.unshift(`✨ ${score}/225 - Great Match`);
    } else if (score >= 50) {
      reasons.unshift(`💫 ${score}/225 - Good Match`);
    }

    return reasons.slice(0, 5); // Show up to 5 reasons
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

    console.log('❌ Passed:', match.name);

    // Move to next (we don't record passes, just skip)
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg
                className="w-12 h-12 text-emerald-600"
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
            <button
              onClick={loadMatches}
              className="w-full px-6 py-3 bg-emerald-500 text-white font-semibold rounded-full hover:bg-emerald-600 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Refresh
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const currentMatch = matches[currentIndex];

  return (
    <div className="min-h-screen bg-white">
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
              <button
                onClick={() => router.push('/history')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="View History"
              >
                <History className="w-6 h-6 text-gray-700" />
              </button>
              <div className="text-sm font-medium text-gray-600">
                {currentIndex + 1} of {matches.length}
              </div>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${((currentIndex + 1) / matches.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Match Card - Sexy Instagram Story Style with Swipe */}
        <motion.div
          className="relative rounded-3xl shadow-2xl overflow-hidden mb-6 cursor-grab active:cursor-grabbing"
          style={{
            height: '60vh',
            maxHeight: '550px',
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
          <div className="absolute inset-0 bg-emerald-500">
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

          {/* Today's Workout Part - BIG BADGE */}
          {currentMatch.today_workout_part && (
            <div className="absolute top-6 left-6 z-10">
              <div className="px-5 py-3 rounded-full backdrop-blur-md bg-emerald-500/90 border-2 border-white/50 shadow-xl">
                <div className="text-white font-bold text-lg capitalize">
                  {currentMatch.today_workout_part}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
            {/* Name and Age */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-4xl font-black text-white drop-shadow-lg">
                  {currentMatch.name}, {currentMatch.age}
                </h2>

                {/* Today's Workout Focus Badge */}
                {currentMatch.today_workout_focus && (() => {
                  const today = new Date().toDateString();
                  const updatedToday = currentMatch.workout_focus_updated_at
                    ? new Date(currentMatch.workout_focus_updated_at).toDateString() === today
                    : false;

                  const isSameFocus = todayFocus && todayFocus !== 'any' && currentMatch.today_workout_focus === todayFocus;

                  const focusLabels: Record<string, string> = {
                    chest: 'Chest',
                    back: 'Back',
                    legs: 'Legs',
                    shoulders: 'Shoulders',
                    arms: 'Arms',
                    core: 'Core',
                    cardio: 'Cardio',
                    any: 'Any',
                  };

                  if (updatedToday) {
                    return (
                      <div className={`
                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                        backdrop-blur-md border text-sm font-bold
                        ${isSameFocus
                          ? 'bg-emerald-500/90 border-emerald-300 text-white animate-pulse'
                          : 'bg-white/20 border-white/30 text-white'
                        }
                      `}>
                        <span>
                          {focusLabels[currentMatch.today_workout_focus] || 'Today'}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="flex items-center gap-3 text-white/90 text-sm">
                <span>{currentMatch.location}</span>
                {currentMatch.distance && (
                  <span>• {currentMatch.distance} miles</span>
                )}
              </div>
            </div>

            {/* PR Stats - Big 3 + Big 3 Total */}
            {(currentMatch.bench_pr || currentMatch.squat_pr || currentMatch.deadlift_pr || currentMatch.big_three_total) && (
              <div className="mb-4">
                {/* Big 3 Total with Progress Bar */}
                {currentMatch.big_three_total && (
                  <div className="mb-3 backdrop-blur-md bg-gradient-to-r from-yellow-500/90 to-orange-500/90 rounded-2xl p-4 border-2 border-yellow-300/50 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">🏆</span>
                        <div>
                          <div className="text-white/80 text-xs font-bold uppercase tracking-wider">Big 3 Total</div>
                          <div className="text-white font-black text-2xl">{currentMatch.big_three_total} lbs</div>
                        </div>
                      </div>
                      {currentMatch.body_weight && (
                        <div className="text-right">
                          <div className="text-white/80 text-xs font-bold uppercase tracking-wider">Ratio</div>
                          <div className="text-white font-bold text-lg">{(currentMatch.big_three_total / currentMatch.body_weight).toFixed(1)}x</div>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar to 1000 Club */}
                    {currentMatch.big_three_total < 1000 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-white/80 font-medium">
                          <span>Progress to 1000 Club</span>
                          <span>{Math.round((currentMatch.big_three_total / 1000) * 100)}%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-white h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((currentMatch.big_three_total / 1000) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {currentMatch.big_three_total >= 1000 && currentMatch.big_three_total < 1500 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-white/80 font-medium">
                          <span>Progress to 1500 Elite</span>
                          <span>{Math.round(((currentMatch.big_three_total - 1000) / 500) * 100)}%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-white h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(((currentMatch.big_three_total - 1000) / 500) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {currentMatch.big_three_total >= 1500 && (
                      <div className="text-center text-white/90 text-sm font-bold animate-pulse">
                        ⭐ Elite Powerlifter ⭐
                      </div>
                    )}
                  </div>
                )}

                {/* Individual PRs Grid with Strength Level Badges */}
                <div className="grid grid-cols-3 gap-2">
                  {currentMatch.bench_pr && currentMatch.body_weight && (() => {
                    const ratio = currentMatch.bench_pr / currentMatch.body_weight;
                    let level = 'Beginner';
                    let badgeColor = 'bg-gray-500';
                    if (ratio >= 2.0) { level = 'Elite'; badgeColor = 'bg-purple-500'; }
                    else if (ratio >= 1.5) { level = 'Advanced'; badgeColor = 'bg-red-500'; }
                    else if (ratio >= 1.0) { level = 'Intermediate'; badgeColor = 'bg-orange-500'; }
                    else if (ratio >= 0.75) { level = 'Novice'; badgeColor = 'bg-yellow-500'; }

                    return (
                      <div className="backdrop-blur-md bg-white/10 rounded-xl p-2.5 border border-white/20 text-center relative">
                        <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 ${badgeColor} text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-lg`}>
                          {level}
                        </div>
                        <div className="text-lg mb-0.5 mt-1">🏋️</div>
                        <div className="text-white font-bold text-base">{currentMatch.bench_pr}</div>
                        <div className="text-white/70 text-xs">Bench</div>
                      </div>
                    );
                  })()}
                  {currentMatch.squat_pr && currentMatch.body_weight && (() => {
                    const ratio = currentMatch.squat_pr / currentMatch.body_weight;
                    let level = 'Beginner';
                    let badgeColor = 'bg-gray-500';
                    if (ratio >= 2.5) { level = 'Elite'; badgeColor = 'bg-purple-500'; }
                    else if (ratio >= 2.0) { level = 'Advanced'; badgeColor = 'bg-red-500'; }
                    else if (ratio >= 1.5) { level = 'Intermediate'; badgeColor = 'bg-orange-500'; }
                    else if (ratio >= 1.0) { level = 'Novice'; badgeColor = 'bg-yellow-500'; }

                    return (
                      <div className="backdrop-blur-md bg-white/10 rounded-xl p-2.5 border border-white/20 text-center relative">
                        <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 ${badgeColor} text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-lg`}>
                          {level}
                        </div>
                        <div className="text-lg mb-0.5 mt-1">🦵</div>
                        <div className="text-white font-bold text-base">{currentMatch.squat_pr}</div>
                        <div className="text-white/70 text-xs">Squat</div>
                      </div>
                    );
                  })()}
                  {currentMatch.deadlift_pr && currentMatch.body_weight && (() => {
                    const ratio = currentMatch.deadlift_pr / currentMatch.body_weight;
                    let level = 'Beginner';
                    let badgeColor = 'bg-gray-500';
                    if (ratio >= 2.75) { level = 'Elite'; badgeColor = 'bg-purple-500'; }
                    else if (ratio >= 2.25) { level = 'Advanced'; badgeColor = 'bg-red-500'; }
                    else if (ratio >= 1.75) { level = 'Intermediate'; badgeColor = 'bg-orange-500'; }
                    else if (ratio >= 1.25) { level = 'Novice'; badgeColor = 'bg-yellow-500'; }

                    return (
                      <div className="backdrop-blur-md bg-white/10 rounded-xl p-2.5 border border-white/20 text-center relative">
                        <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 ${badgeColor} text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-lg`}>
                          {level}
                        </div>
                        <div className="text-lg mb-0.5 mt-1">💪</div>
                        <div className="text-white font-bold text-base">{currentMatch.deadlift_pr}</div>
                        <div className="text-white/70 text-xs">Deadlift</div>
                      </div>
                    );
                  })()}
                  {currentMatch.overhead_press_pr && (
                    <div className="backdrop-blur-md bg-white/10 rounded-xl p-2.5 border border-white/20 text-center">
                      <div className="text-lg mb-0.5">🔥</div>
                      <div className="text-white font-bold text-base">{currentMatch.overhead_press_pr}</div>
                      <div className="text-white/70 text-xs">OHP</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Weekly Schedule Calendar */}
            {currentMatch.workout_split && currentMatch.weekly_frequency && (
              <div className="mb-3 backdrop-blur-md bg-white/10 rounded-2xl p-3 border border-white/20">
                <div className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>📅</span>
                  <span>Weekly Schedule</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                    const isWorkoutDay = idx < currentMatch.weekly_frequency!;

                    // PPL pattern: Push, Pull, Legs, Push, Pull, Legs, Rest
                    let splitEmoji = '💪';
                    if (currentMatch.workout_split === 'PPL') {
                      const cycle = idx % 6;
                      if (cycle === 0 || cycle === 3) splitEmoji = '⬆️'; // Push
                      else if (cycle === 1 || cycle === 4) splitEmoji = '⬇️'; // Pull
                      else if (cycle === 2 || cycle === 5) splitEmoji = '🦵'; // Legs
                    } else if (currentMatch.workout_split === 'Upper/Lower') {
                      splitEmoji = idx % 2 === 0 ? '⬆️' : '⬇️';
                    } else if (currentMatch.workout_split === 'Bro Split') {
                      const muscles = ['💪', '🦵', '🔥', '🏋️', '⚡'];
                      splitEmoji = muscles[idx % 5];
                    } else if (currentMatch.workout_split === 'Full Body') {
                      splitEmoji = '🏋️';
                    }

                    return (
                      <div
                        key={idx}
                        className={`
                          aspect-square rounded-lg flex flex-col items-center justify-center text-xs
                          ${isWorkoutDay
                            ? 'bg-emerald-500/90 text-white font-bold shadow-lg'
                            : 'bg-white/20 text-white/50'
                          }
                        `}
                      >
                        <div className="text-xs">{day}</div>
                        {isWorkoutDay && (
                          <div className="text-base">{splitEmoji}</div>
                        )}
                        {!isWorkoutDay && (
                          <div className="text-sm">😴</div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 text-center text-white/70 text-xs">
                  {currentMatch.workout_split} • {currentMatch.weekly_frequency}x/week
                </div>
              </div>
            )}

            {/* Workout Details Row */}
            <div className="flex flex-wrap gap-2 mb-3">
              {/* Workout Split - Most Important! */}
              {currentMatch.workout_split && (
                <div className="px-3 py-1.5 backdrop-blur-md bg-gradient-to-r from-emerald-500/90 to-teal-500/90 rounded-full border-2 border-emerald-300/50 text-white text-sm font-black flex items-center gap-1.5 shadow-lg">
                  <span>💪</span>
                  <span>{currentMatch.workout_split}</span>
                </div>
              )}

              {/* Weekly Frequency */}
              {currentMatch.weekly_frequency && (
                <div className="px-3 py-1.5 backdrop-blur-md bg-white/15 rounded-full border border-white/30 text-white text-sm font-medium flex items-center gap-1.5">
                  <span>📅</span>
                  <span>{currentMatch.weekly_frequency}x/week</span>
                </div>
              )}

              {/* Years Training */}
              {currentMatch.years_training && (
                <div className="px-3 py-1.5 backdrop-blur-md bg-white/15 rounded-full border border-white/30 text-white text-sm font-medium flex items-center gap-1.5">
                  <span>🏋️</span>
                  <span>{currentMatch.years_training}yr{currentMatch.years_training > 1 ? 's' : ''}</span>
                </div>
              )}

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

              {/* Preferred Time */}
              {currentMatch.preferred_time && (
                <div className="px-3 py-1.5 backdrop-blur-md bg-white/15 rounded-full border border-white/30 text-white text-sm font-medium flex items-center gap-1.5">
                  <span>🕐</span>
                  <span className="capitalize">{currentMatch.preferred_time.replace('_', ' ')}</span>
                </div>
              )}

              {/* Workout Time (legacy) */}
              {currentMatch.workout_time_preference && !currentMatch.preferred_time && (
                <div className="px-3 py-1.5 backdrop-blur-md bg-white/15 rounded-full border border-white/30 text-white text-sm font-medium flex items-center gap-1.5">
                  <span>🕐</span>
                  <span className="capitalize">{currentMatch.workout_time_preference.replace('_', ' ')}</span>
                </div>
              )}

              {/* Experience (legacy) */}
              {currentMatch.workout_experience_months && !currentMatch.years_training && (
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
                    className="px-3 py-1 backdrop-blur-md bg-emerald-500/80 rounded-full text-white text-xs font-medium border border-white/30"
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
            className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center hover:bg-emerald-600 hover:scale-110 active:scale-95 transition-all duration-200 shadow-xl hover:shadow-2xl"
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
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm font-medium text-gray-700">
            ❤️ Like • ✕ Pass
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

      {/* Today's Workout Focus Popup */}
      {showWorkoutPopup && (
        <TodayWorkoutPopup
          onClose={() => {
            setShowWorkoutPopup(false);
            setTodayFocus('any'); // Default if they close without selecting
          }}
          onSelect={(focus) => {
            setTodayFocus(focus);
          }}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

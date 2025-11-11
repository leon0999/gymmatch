'use client';

/**
 * GymMatch - Discover Page (MVP Version)
 *
 * Simple matching interface with:
 * - List of potential matches
 * - Match scores
 * - Like/Pass buttons
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import MatchModal from '@/components/MatchModal';
import BottomNav from '@/components/BottomNav';

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

  useEffect(() => {
    loadMatches();
  }, []);

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

      // Get users already swiped
      const { data: swipedUsers } = await supabase
        .from('swipes')
        .select('target_user_id')
        .eq('user_id', user.id);

      const swipedUserIds = new Set(
        (swipedUsers || []).map((s) => s.target_user_id)
      );

      // Get all other profiles (excluding self and already swiped)
      const { data: allProfiles, error: matchError } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .limit(50);

      if (matchError) {
        setError('Could not load matches');
        return;
      }

      // Filter out already swiped users
      const unseenProfiles = (allProfiles || []).filter(
        (p) => !swipedUserIds.has(p.user_id)
      );

      // Apply preference filters
      const filteredProfiles = unseenProfiles.filter((match) => {
        // Gender filter
        if (profile.partner_gender !== 'any' && match.gender !== profile.partner_gender) {
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

      // Calculate match scores (improved algorithm)
      const scored = filteredProfiles.map((match) => ({
        ...match,
        matchScore: calculateImprovedScore(profile, match),
        distance: calculateSimpleDistance(profile, match),
        matchReasons: getMatchReasons(profile, match),
      }));

      // Sort by score
      scored.sort((a, b) => b.matchScore - a.matchScore);

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
      // Record swipe in database
      const { error } = await supabase.from('swipes').insert({
        user_id: currentUser.user_id,
        target_user_id: match.user_id,
        action: 'like',
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
      // Record swipe in database
      const { error } = await supabase.from('swipes').insert({
        user_id: currentUser.user_id,
        target_user_id: match.user_id,
        action: 'pass',
      });

      if (error) {
        console.error('Error recording pass:', error);
      } else {
        console.log('❌ Passed:', match.name);
      }
    } catch (err) {
      console.error('Error in handlePass:', err);
    }

    // Move to next
    setCurrentIndex(currentIndex + 1);
  };

  const checkMutualMatch = async (userId: string, targetUserId: string) => {
    try {
      // Check if target user also liked current user
      const { data: mutualLike } = await supabase
        .from('swipes')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('target_user_id', userId)
        .eq('action', 'like')
        .single();

      if (mutualLike) {
        // Create mutual match
        const { data: newMatch, error } = await supabase.from('matches').insert({
          user1_id: userId,
          user2_id: targetUserId,
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
            <div className="text-sm font-medium text-gray-600">
              {currentIndex + 1} of {matches.length}
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

        {/* Match Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Profile Image */}
          <div className="h-96 bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center overflow-hidden relative">
            {currentMatch.photo_url ? (
              <img
                src={currentMatch.photo_url}
                alt={currentMatch.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-6xl">👤</span>
                </div>
                <p className="text-white text-sm opacity-75">Photo coming soon</p>
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="p-6">
            {/* Name and Match Score */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {currentMatch.name}, {currentMatch.age}
                </h2>
                <p className="text-gray-600 mt-1">
                  {currentMatch.location_name}
                  {currentMatch.distance && ` • ${currentMatch.distance} miles away`}
                </p>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${
                  currentMatch.matchScore >= 80 ? 'text-green-600' :
                  currentMatch.matchScore >= 60 ? 'text-blue-600' :
                  'text-yellow-600'
                }`}>
                  {currentMatch.matchScore}%
                </div>
                <div className="text-xs text-gray-500">Match</div>
              </div>
            </div>

            {/* Bio */}
            {currentMatch.bio && (
              <p className="text-gray-700 mb-4">{currentMatch.bio}</p>
            )}

            {/* Match Reasons */}
            {currentMatch.matchReasons.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {currentMatch.matchReasons.map((reason, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <div className="text-xs text-gray-500 mb-1">Fitness Level</div>
                <div className="font-semibold capitalize">{currentMatch.fitness_level}</div>
              </div>
              {currentMatch.gym && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Gym</div>
                  <div className="font-semibold">{currentMatch.gym}</div>
                </div>
              )}
              {currentMatch.fitness_goals && currentMatch.fitness_goals.length > 0 && (
                <div className="col-span-2">
                  <div className="text-xs text-gray-500 mb-1">Goals</div>
                  <div className="flex flex-wrap gap-2">
                    {currentMatch.fitness_goals.map((goal, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-sm capitalize">
                        {goal.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {currentMatch.workout_styles && currentMatch.workout_styles.length > 0 && (
                <div className="col-span-2">
                  <div className="text-xs text-gray-500 mb-1">Workout Styles</div>
                  <div className="flex flex-wrap gap-2">
                    {currentMatch.workout_styles.map((style, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-sm capitalize">
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

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

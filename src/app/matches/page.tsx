'use client';

/**
 * GymMatch - Matches List Page
 *
 * 매칭된 사람들 리스트 + 최근 메시지 미리보기
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import BottomNav from '@/components/BottomNav';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface MatchWithProfile {
  matchId: string;
  profile: Profile;
  lastMessage?: string;
  lastMessageTime?: string;
  matchedAt: string;
}

export default function MatchesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        router.push('/signup');
        return;
      }

      setCurrentUser(user);

      // Get all matches for current user
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('matched_at', { ascending: false });

      if (matchesError) {
        console.error('Matches error:', matchesError);
        setError('Could not load matches');
        return;
      }

      if (!matchesData || matchesData.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      // Get profile for each match
      const matchesWithProfiles: MatchWithProfile[] = [];

      for (const match of matchesData) {
        // Determine the other user's ID
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;

        // Get other user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', otherUserId)
          .single();

        if (!profile) continue;

        // Get last message for this match
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('message, created_at')
          .eq('match_id', match.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        matchesWithProfiles.push({
          matchId: match.id,
          profile,
          lastMessage: lastMsg?.message,
          lastMessageTime: lastMsg?.created_at,
          matchedAt: match.matched_at,
        });
      }

      setMatches(matchesWithProfiles);
    } catch (err: any) {
      console.error('Error loading matches:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Matches</h1>
            <p className="text-gray-600 mt-1">
              {matches.length} {matches.length === 1 ? 'match' : 'matches'}
            </p>
          </div>
          <Link
            href="/"
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            ← Home
          </Link>
        </div>

        {/* Empty State */}
        {matches.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No matches yet
            </h2>
            <p className="text-gray-600 mb-6">
              Keep swiping to find your perfect gym partner!
            </p>
            <Link
              href="/discover"
              className="inline-block px-6 py-3 bg-teal-600 text-white font-semibold rounded-full hover:bg-teal-700 transition-colors"
            >
              Start Swiping
            </Link>
          </div>
        )}

        {/* Matches List */}
        {matches.length > 0 && (
          <div className="space-y-3">
            {matches.map((match) => (
              <Link
                key={match.matchId}
                href={`/chat/${match.matchId}`}
                className="block bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-4"
              >
                <div className="flex items-center gap-4">
                  {/* Profile Picture Placeholder */}
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">👤</span>
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {match.profile.name}, {match.profile.age}
                      </h3>
                      {match.lastMessageTime && (
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatTime(match.lastMessageTime)}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      {match.profile.location_name}
                      {match.profile.gym && ` • ${match.profile.gym}`}
                    </p>

                    {match.lastMessage ? (
                      <p className="text-sm text-gray-700 truncate">
                        {match.lastMessage}
                      </p>
                    ) : (
                      <p className="text-sm text-teal-600 font-medium">
                        💬 Start chatting!
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <svg
                    className="w-6 h-6 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

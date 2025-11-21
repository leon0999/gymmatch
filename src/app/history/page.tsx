'use client';

/**
 * GymMatch - History Page
 *
 * Shows:
 * - People who liked you
 * - People you liked
 * - Matches
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import { Heart, X, Check, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface LikeWithProfile {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
  profile?: Profile;
}

interface MatchWithProfiles {
  id: string;
  user1_id: string;
  user2_id: string;
  matched_at: string;
  partner?: Profile;
}

export default function HistoryPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'matches'>('received');

  const [receivedLikes, setReceivedLikes] = useState<LikeWithProfile[]>([]);
  const [sentLikes, setSentLikes] = useState<LikeWithProfile[]>([]);
  const [matches, setMatches] = useState<MatchWithProfiles[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        router.push('/onboarding');
        return;
      }

      setCurrentUser(profile);

      // Load received likes (people who liked me) - using swipes table
      const { data: receivedData } = await supabase
        .from('swipes')
        .select('*')
        .eq('target_user_id', user.id)
        .eq('action', 'like')
        .order('created_at', { ascending: false });

      if (receivedData) {
        const receivedWithProfiles = await Promise.all(
          receivedData.map(async (like) => {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', like.user_id)
              .single();

            return {
              ...like,
              profile: senderProfile,
            };
          })
        );
        setReceivedLikes(receivedWithProfiles);
      }

      // Load sent likes (people I liked) - using swipes table
      const { data: sentData } = await supabase
        .from('swipes')
        .select('*')
        .eq('user_id', user.id)
        .eq('action', 'like')
        .order('created_at', { ascending: false });

      if (sentData) {
        const sentWithProfiles = await Promise.all(
          sentData.map(async (like) => {
            const { data: targetProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', like.target_user_id)
              .single();

            return {
              ...like,
              profile: targetProfile,
            };
          })
        );
        setSentLikes(sentWithProfiles);
      }

      // Load matches
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('matched_at', { ascending: false });

      if (matchesData) {
        const matchesWithProfiles = await Promise.all(
          matchesData.map(async (match) => {
            const partnerId = match.user1_id === user.id ? match.user2_id : match.user1_id;
            const { data: partnerProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', partnerId)
              .single();

            return {
              ...match,
              partner: partnerProfile,
            };
          })
        );
        setMatches(matchesWithProfiles);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Activity History</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'received'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Received ({receivedLikes.length})
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sent ({sentLikes.length})
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'matches'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Matches ({matches.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4">
        {/* Received Likes */}
        {activeTab === 'received' && (
          <div className="space-y-3">
            {receivedLikes.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 font-semibold mb-2">No likes received yet</p>
                <p className="text-gray-400 text-sm">Keep swiping to find your gym partner!</p>
              </div>
            ) : (
              receivedLikes.map((like) => (
                <div
                  key={like.id}
                  className="bg-white rounded-lg p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {like.profile?.photo_url ? (
                      <img
                        src={like.profile.photo_url}
                        alt={like.profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{like.profile?.name}, {like.profile?.age}</p>
                    <p className="text-sm text-gray-600">
                      📍 {like.profile?.location_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(like.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                </div>
              ))
            )}
          </div>
        )}

        {/* Sent Likes */}
        {activeTab === 'sent' && (
          <div className="space-y-3">
            {sentLikes.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 font-semibold mb-2">No likes sent yet</p>
                <p className="text-gray-400 text-sm">Start swiping right to like profiles!</p>
              </div>
            ) : (
              sentLikes.map((like) => (
                <div
                  key={like.id}
                  className="bg-white rounded-lg p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {like.profile?.photo_url ? (
                      <img
                        src={like.profile.photo_url}
                        alt={like.profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{like.profile?.name}, {like.profile?.age}</p>
                    <p className="text-sm text-gray-600">
                      📍 {like.profile?.location_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(like.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Heart className="w-6 h-6 text-blue-500" />
                </div>
              ))
            )}
          </div>
        )}

        {/* Matches */}
        {activeTab === 'matches' && (
          <div className="space-y-3">
            {matches.length === 0 ? (
              <div className="text-center py-12">
                <Check className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 font-semibold mb-2">No matches yet</p>
                <p className="text-gray-400 text-sm">Match with someone to start chatting!</p>
              </div>
            ) : (
              matches.map((match) => (
                <div
                  key={match.id}
                  onClick={() => router.push(`/matches/${match.id}/chat`)}
                  className="bg-white rounded-lg p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {match.partner?.photo_url ? (
                      <img
                        src={match.partner.photo_url}
                        alt={match.partner.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{match.partner?.name}, {match.partner?.age}</p>
                    <p className="text-sm text-gray-600">
                      📍 {match.partner?.location_name}
                    </p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">
                      ✅ Matched
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400"
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
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

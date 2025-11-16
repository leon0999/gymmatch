'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Camera, X } from 'lucide-react';
import { Post } from '@/lib/types';
import PostCard from '@/components/PostCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';

interface ApprovedMatch {
  matchId: string;
  partnerId: string;
  partnerName: string;
  partnerPhotoUrl?: string;
}

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showApprovedMatchesModal, setShowApprovedMatchesModal] = useState(false);
  const [approvedMatches, setApprovedMatches] = useState<ApprovedMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Load initial feed
  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async (pageNum: number = 0) => {
    try {
      if (pageNum === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const res = await fetch(`/api/feed?page=${pageNum}&limit=10`);
      const data = await res.json();

      if (data.success) {
        if (pageNum === 0) {
          setPosts(data.data.posts);
        } else {
          setPosts(prev => [...prev, ...data.data.posts]);
        }
        setHasMore(data.data.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadFeed(page + 1);
    }
  };

  const handleLikeChange = (postId: string, liked: boolean, likesCount: number) => {
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? { ...post, likes_count: likesCount }
          : post
      )
    );
  };

  const handleCommentChange = (postId: string, commentsCount: number) => {
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? { ...post, comments_count: commentsCount }
          : post
      )
    );
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  const loadApprovedMatches = async () => {
    try {
      setLoadingMatches(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all matches where both users have approved
      const { data: matchesData, error } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('user1_photo_session_approved', true)
        .eq('user2_photo_session_approved', true);

      if (error) {
        console.error('Error loading approved matches:', error);
        return;
      }

      if (!matchesData || matchesData.length === 0) {
        setApprovedMatches([]);
        return;
      }

      // Get partner profiles
      const approvedMatchesList: ApprovedMatch[] = [];

      for (const match of matchesData) {
        const partnerId = match.user1_id === user.id ? match.user2_id : match.user1_id;

        // Get partner profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, photo_url')
          .eq('user_id', partnerId)
          .single();

        if (profile) {
          approvedMatchesList.push({
            matchId: match.id,
            partnerId,
            partnerName: profile.name,
            partnerPhotoUrl: profile.photo_url,
          });
        }
      }

      setApprovedMatches(approvedMatchesList);
    } catch (err) {
      console.error('Error loading approved matches:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleAddPhotoClick = async () => {
    await loadApprovedMatches();
    setShowApprovedMatchesModal(true);
  };

  const handleSelectMatch = (matchId: string) => {
    setShowApprovedMatchesModal(false);
    router.push(`/matches/${matchId}/photo-session`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Dumbbell className="w-7 h-7 text-emerald-500" />
              <h1 className="text-2xl font-black text-emerald-600">
                GymMatch
              </h1>
            </div>
            <div className="text-sm font-medium text-gray-600">
              {posts.length} posts
            </div>
          </div>
        </div>
      </div>

      {/* Feed Content */}
      <div className="max-w-2xl mx-auto">
        {posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-20"
          >
            <Dumbbell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 text-xl font-semibold mb-2">No posts yet</p>
            <p className="text-gray-400 text-sm">
              Start matching with partners and share workout photos!
            </p>
          </motion.div>
        ) : (
          <div className="space-y-0">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.05,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                <PostCard
                  post={post}
                  onLikeChange={handleLikeChange}
                  onCommentChange={handleCommentChange}
                  onDelete={handleDeletePost}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8 text-center"
          >
            <motion.button
              onClick={loadMore}
              disabled={loadingMore}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-emerald-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <span className="flex items-center space-x-2">
                  <LoadingSpinner />
                  <span>Loading...</span>
                </span>
              ) : (
                'Load More'
              )}
            </motion.button>
          </motion.div>
        )}

        {!hasMore && posts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center"
          >
            <div className="inline-flex items-center space-x-2 text-gray-400 text-sm">
              <div className="h-px w-12 bg-gray-300"></div>
              <span>You're all caught up</span>
              <div className="h-px w-12 bg-gray-300"></div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Floating Add Photo Button */}
      <motion.button
        onClick={handleAddPhotoClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center z-20"
      >
        <Camera className="w-6 h-6" />
      </motion.button>

      {/* Approved Matches Modal */}
      <AnimatePresence>
        {showApprovedMatchesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowApprovedMatchesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  사진 올릴 파트너 선택
                </h2>
                <button
                  onClick={() => setShowApprovedMatchesModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
                {loadingMatches ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : approvedMatches.length === 0 ? (
                  <div className="text-center py-12 px-6">
                    <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600 font-semibold mb-2">
                      승인된 파트너가 없습니다
                    </p>
                    <p className="text-gray-400 text-sm">
                      채팅에서 Photo Session을 먼저 승인해주세요!
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {approvedMatches.map((match) => (
                      <motion.button
                        key={match.matchId}
                        onClick={() => handleSelectMatch(match.matchId)}
                        whileHover={{ backgroundColor: '#f9fafb' }}
                        className="w-full p-4 flex items-center gap-4 transition-colors"
                      >
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                          {match.partnerPhotoUrl ? (
                            <img
                              src={match.partnerPhotoUrl}
                              alt={match.partnerName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl">👤</span>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-gray-900">
                            {match.partnerName}
                          </p>
                          <p className="text-sm text-emerald-600 flex items-center gap-1">
                            <Camera className="w-4 h-4" />
                            Photo Session 승인됨
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
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

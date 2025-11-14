'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell } from 'lucide-react';
import { Post } from '@/lib/types';
import PostCard from '@/components/PostCard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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
    </div>
  );
}

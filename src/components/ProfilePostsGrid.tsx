'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Post } from '@/lib/types';
import { Heart, MessageCircle, Play, Dumbbell } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface ProfilePostsGridProps {
  userId: string;
}

export default function ProfilePostsGrid({ userId }: ProfilePostsGridProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    loadPosts();
  }, [userId]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${userId}/posts`);
      const data = await res.json();

      if (data.success) {
        setPosts(data.data.posts);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center py-16"
      >
        <Dumbbell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-600 text-lg font-semibold mb-2">No workout photos yet</p>
        <p className="text-gray-400 text-sm">
          Start matching with partners to share workout photos!
        </p>
      </motion.div>
    );
  }

  return (
    <>
      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-1 p-1">
        {posts.map((post, index) => (
          <motion.button
            key={post.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.3,
              delay: index * 0.03,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedPost(post)}
            className="relative aspect-square bg-gray-200 overflow-hidden group cursor-pointer rounded-sm"
          >
            {/* Thumbnail */}
            <Image
              src={post.thumbnail_url || post.media_url}
              alt="Workout photo"
              fill
              className="object-cover"
            />

            {/* Video Indicator */}
            {post.media_type === 'video' && (
              <div className="absolute top-2 right-2">
                <Play className="w-5 h-5 text-white drop-shadow-lg" fill="white" />
              </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center space-x-6">
              <motion.div
                initial={{ y: 10 }}
                whileHover={{ y: 0 }}
                className="flex items-center text-white"
              >
                <Heart className="w-6 h-6 mr-2 fill-white drop-shadow-lg" />
                <span className="font-bold text-lg drop-shadow-lg">{post.likes_count}</span>
              </motion.div>
              <motion.div
                initial={{ y: 10 }}
                whileHover={{ y: 0 }}
                className="flex items-center text-white"
              >
                <MessageCircle className="w-6 h-6 mr-2 fill-white drop-shadow-lg" />
                <span className="font-bold text-lg drop-shadow-lg">{post.comments_count}</span>
              </motion.div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Close Button */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center z-10">
              <h3 className="font-semibold">Post</h3>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>

            {/* Media */}
            <div className="relative w-full aspect-square bg-black">
              {selectedPost.media_type === 'video' ? (
                <video
                  src={selectedPost.media_url}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <Image
                  src={selectedPost.media_url}
                  alt="Workout photo"
                  fill
                  className="object-contain"
                />
              )}
            </div>

            {/* Info */}
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                {selectedPost.photographer?.photo_url ? (
                  <Image
                    src={selectedPost.photographer.photo_url}
                    alt={selectedPost.photographer.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {selectedPost.photographer?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold">
                    {selectedPost.photographer?.name}
                    <span className="font-normal text-gray-500"> photographed </span>
                    {selectedPost.user?.name}
                  </p>
                  {selectedPost.workout_type && (
                    <p className="text-sm text-gray-500 capitalize">
                      {selectedPost.workout_type}
                    </p>
                  )}
                </div>
              </div>

              {selectedPost.caption && (
                <p className="text-gray-700 mb-4">{selectedPost.caption}</p>
              )}

              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Heart className="w-4 h-4 mr-1" />
                  {selectedPost.likes_count} likes
                </div>
                <div className="flex items-center">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {selectedPost.comments_count} comments
                </div>
                <div className="ml-auto">
                  {new Date(selectedPost.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

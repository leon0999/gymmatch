'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Post } from '@/lib/types';
import { Heart, MessageCircle, MoreVertical } from 'lucide-react';
import CommentSection from './CommentSection';
import UserProfileModal from './UserProfileModal';
import { supabase } from '@/lib/supabase';

interface PostCardProps {
  post: Post;
  onLikeChange?: (postId: string, liked: boolean, likesCount: number) => void;
  onCommentChange?: (postId: string, commentsCount: number) => void;
  onDelete?: (postId: string) => void;
}

export default function PostCard({ post, onLikeChange, onCommentChange, onDelete }: PostCardProps) {
  const [liked, setLiked] = useState(post.isLikedByCurrentUser || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleLike = async () => {
    if (loading) return;

    const newLiked = !liked;
    const optimisticCount = newLiked ? likesCount + 1 : likesCount - 1;

    // Optimistic update
    setLiked(newLiked);
    setLikesCount(optimisticCount);
    onLikeChange?.(post.id, newLiked, optimisticCount);

    try {
      setLoading(true);

      // Get session token for Authorization header
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: newLiked ? 'POST' : 'DELETE',
        headers,
        credentials: 'same-origin', // Include cookies as fallback
      });

      const data = await res.json();

      if (!res.ok) {
        // Revert on error
        setLiked(!newLiked);
        setLikesCount(newLiked ? optimisticCount - 1 : optimisticCount + 1);
        onLikeChange?.(post.id, !newLiked, newLiked ? optimisticCount - 1 : optimisticCount + 1);
      } else if (data.alreadyLiked) {
        // Server says already liked, sync with server state
        console.log('ℹ️  Syncing like state with server:', data.likes_count);
        setLiked(true);
        setLikesCount(data.likes_count);
        onLikeChange?.(post.id, true, data.likes_count);
      }
    } catch (error) {
      console.error('Failed to like post:', error);
      // Revert on error
      setLiked(!newLiked);
      setLikesCount(newLiked ? optimisticCount - 1 : optimisticCount + 1);
      onLikeChange?.(post.id, !newLiked, newLiked ? optimisticCount - 1 : optimisticCount + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      // Get session token for Authorization header
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'same-origin', // Include cookies as fallback
      });

      if (res.ok) {
        onDelete?.(post.id);
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post');
    }
  };

  const handleCommentAdded = () => {
    const newCount = commentsCount + 1;
    setCommentsCount(newCount);
    onCommentChange?.(post.id, newCount);
  };

  const handleCommentDeleted = () => {
    const newCount = Math.max(0, commentsCount - 1);
    setCommentsCount(newCount);
    onCommentChange?.(post.id, newCount);
  };

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setShowProfileModal(true);
  };

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          {post.photographer?.photo_url ? (
            <Image
              src={post.photographer.photo_url}
              alt={post.photographer.name}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {post.photographer?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-900">
              <button
                onClick={() => handleUserClick(post.photographer_id)}
                className="font-semibold hover:underline"
              >
                {post.photographer?.name}
              </button>
              <span className="font-normal text-gray-700"> photographed </span>
              <button
                onClick={() => handleUserClick(post.user_id)}
                className="font-semibold hover:underline"
              >
                {post.user?.name}
              </button>
            </p>
            {post.workout_type && (
              <p className="text-xs text-gray-700 capitalize">{post.workout_type}</p>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <MoreVertical className="w-5 h-5 text-gray-900" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600"
              >
                Delete
              </button>
              <button
                onClick={() => setShowMenu(false)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Media */}
      <div className="relative w-full aspect-square bg-black">
        {post.media_type === 'video' ? (
          <video
            src={post.media_url}
            controls
            className="w-full h-full object-contain"
          />
        ) : (
          <Image
            src={post.thumbnail_url || post.media_url}
            alt="Workout photo"
            fill
            className="object-contain"
          />
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center space-x-6 mb-3">
          {/* Like Button with Count */}
          <button
            onClick={handleLike}
            disabled={loading}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity disabled:opacity-50"
          >
            <Heart
              className={`w-7 h-7 ${
                liked ? 'fill-red-500 text-red-500' : 'text-gray-900'
              }`}
            />
            <span className="text-base font-semibold text-gray-900">
              {likesCount}
            </span>
          </button>

          {/* Comment Button with Count */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <MessageCircle className="w-7 h-7 text-gray-900" />
            <span className="text-base font-semibold text-gray-900">
              {commentsCount}
            </span>
          </button>
        </div>

        {/* Caption & Workout Info */}
        <div className="mb-2">
          {/* Username + Caption */}
          <p className="text-sm text-gray-900">
            <span className="font-semibold text-gray-900 mr-1">{post.photographer?.name}</span>
            {post.caption ? (
              <span className="text-gray-900">{post.caption}</span>
            ) : (
              <span className="text-gray-500 italic">No caption</span>
            )}
          </p>

          {/* Workout Details */}
          {(post.workout_type || post.exercise_name) && (
            <div className="mt-1 flex flex-wrap gap-2">
              {post.workout_type && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 capitalize">
                  {post.workout_type}
                </span>
              )}
              {post.exercise_name && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {post.exercise_name}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <p className="text-xs text-gray-600 uppercase">
          {new Date(post.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection
          postId={post.id}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
        />
      )}

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}

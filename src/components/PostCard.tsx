'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Post } from '@/lib/types';
import { Heart, MessageCircle, MoreVertical } from 'lucide-react';
import CommentSection from './CommentSection';

interface PostCardProps {
  post: Post;
  onLikeChange?: (postId: string, liked: boolean, likesCount: number) => void;
  onCommentChange?: (postId: string, commentsCount: number) => void;
  onDelete?: (postId: string) => void;
}

export default function PostCard({ post, onLikeChange, onCommentChange, onDelete }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);

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
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: newLiked ? 'POST' : 'DELETE',
      });

      if (!res.ok) {
        // Revert on error
        setLiked(!newLiked);
        setLikesCount(newLiked ? optimisticCount - 1 : optimisticCount + 1);
        onLikeChange?.(post.id, !newLiked, newLiked ? optimisticCount - 1 : optimisticCount + 1);
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
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
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
            <p className="font-semibold text-sm">
              {post.photographer?.name}
              <span className="font-normal text-gray-500"> photographed </span>
              {post.user?.name}
            </p>
            {post.workout_type && (
              <p className="text-xs text-gray-500 capitalize">{post.workout_type}</p>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <MoreVertical className="w-5 h-5" />
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
        <div className="flex items-center space-x-4 mb-2">
          <button
            onClick={handleLike}
            disabled={loading}
            className="p-1 hover:opacity-70 transition-opacity disabled:opacity-50"
          >
            <Heart
              className={`w-7 h-7 ${
                liked ? 'fill-red-500 text-red-500' : 'text-gray-900'
              }`}
            />
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="p-1 hover:opacity-70 transition-opacity"
          >
            <MessageCircle className="w-7 h-7" />
          </button>
        </div>

        {/* Likes Count */}
        {likesCount > 0 && (
          <p className="font-semibold text-sm mb-2">
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
          </p>
        )}

        {/* Caption */}
        {post.caption && (
          <p className="text-sm mb-2">
            <span className="font-semibold mr-2">{post.photographer?.name}</span>
            {post.caption}
          </p>
        )}

        {/* Comments Toggle */}
        {commentsCount > 0 && (
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            View all {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
          </button>
        )}

        {/* Timestamp */}
        <p className="text-xs text-gray-400 uppercase">
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
    </div>
  );
}

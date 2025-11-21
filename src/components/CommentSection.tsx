'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { PostComment } from '@/lib/types';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CommentSectionProps {
  postId: string;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
}

export default function CommentSection({ postId, onCommentAdded, onCommentDeleted }: CommentSectionProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/posts/${postId}/comments?limit=50`, {
        credentials: 'same-origin', // Include cookies
      });
      const data = await res.json();

      if (data.success) {
        setComments(data.data.comments);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || posting) return;

    try {
      setPosting(true);

      // Get session token for Authorization header
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers,
        credentials: 'same-origin', // Include cookies as fallback
        body: JSON.stringify({ comment: newComment.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setComments(prev => [...prev, data.data]);
        setNewComment('');
        onCommentAdded?.();
      } else {
        alert(data.error || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
      alert('Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      // Get session token for Authorization header
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers,
        credentials: 'same-origin', // Include cookies as fallback
      });

      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        onCommentDeleted?.();
      } else {
        alert('Failed to delete comment');
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment');
    }
  };

  return (
    <div className="border-t border-gray-200 px-4 py-3">
      {/* Comments List */}
      {loading ? (
        <p className="text-sm text-gray-500 text-center py-4">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
      ) : (
        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start space-x-2">
              {comment.user?.photo_url ? (
                <Image
                  src={comment.user.photo_url}
                  alt={comment.user.name}
                  width={24}
                  height={24}
                  className="rounded-full flex-shrink-0 mt-1"
                />
              ) : (
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-xs font-medium text-gray-600">
                    {comment.user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-semibold text-gray-900 mr-2">{comment.user?.name}</span>
                  <span className="text-gray-900">{comment.comment}</span>
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(comment.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="text-gray-400 hover:text-red-500 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New Comment Input */}
      <form onSubmit={handlePostComment} className="flex items-center space-x-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 placeholder:text-gray-500"
          disabled={posting}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || posting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {posting ? 'Posting...' : 'Post'}
        </button>
      </form>
    </div>
  );
}

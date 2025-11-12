'use client';

import { useEffect, useState } from 'react';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
        </div>
      </div>

      {/* Feed Content */}
      <div className="max-w-2xl mx-auto">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No posts yet</p>
            <p className="text-gray-400 text-sm">
              Start matching with partners and share workout photos!
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLikeChange={handleLikeChange}
                onCommentChange={handleCommentChange}
                onDelete={handleDeletePost}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="py-8 text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="py-8 text-center text-gray-500">
            You've reached the end
          </div>
        )}
      </div>
    </div>
  );
}

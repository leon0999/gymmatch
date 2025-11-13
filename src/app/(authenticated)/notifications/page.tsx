'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Notification } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Heart, MessageCircle, Image as ImageIcon, UserPlus } from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadNotifications();
    markAllAsRead();
  }, []);

  const loadNotifications = async (pageNum: number = 0) => {
    try {
      if (pageNum === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const res = await fetch(`/api/notifications?page=${pageNum}&limit=20`);
      const data = await res.json();

      if (data.success) {
        if (pageNum === 0) {
          setNotifications(data.data.notifications);
        } else {
          setNotifications(prev => [...prev, ...data.data.notifications]);
        }
        setHasMore(data.data.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadNotifications(page + 1);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Navigate based on notification type
    if (notification.post_id) {
      router.push(`/feed`); // Could navigate to specific post
    } else if (notification.match_id) {
      router.push(`/matches`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500 fill-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'new_post':
        return <ImageIcon className="w-5 h-5 text-green-500" />;
      case 'new_match':
        return <UserPlus className="w-5 h-5 text-purple-500" />;
      default:
        return null;
    }
  };

  const getNotificationText = (notification: Notification) => {
    const fromName = notification.from_user?.name || 'Someone';

    switch (notification.type) {
      case 'like':
        return `${fromName} liked your workout photo`;
      case 'comment':
        return `${fromName} commented: "${notification.comment?.comment || ''}"`;
      case 'new_post':
        return `${fromName} posted a new workout photo of you`;
      case 'new_match':
        return `You matched with ${fromName}!`;
      default:
        return 'New notification';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-2xl mx-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No notifications yet</p>
            <p className="text-gray-400 text-sm">
              You'll see notifications when someone likes or comments on your photos
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full px-4 py-4 flex items-start space-x-3 hover:bg-gray-50 transition-colors text-left ${
                  !notification.is_read ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* From User Avatar */}
                <div className="flex-shrink-0">
                  {notification.from_user?.photo_url ? (
                    <Image
                      src={notification.from_user.photo_url}
                      alt={notification.from_user.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {notification.from_user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {getNotificationText(notification)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(notification.created_at)}
                  </p>
                </div>

                {/* Post Thumbnail */}
                {notification.post?.media_url && (
                  <div className="flex-shrink-0">
                    <Image
                      src={notification.post.thumbnail_url || notification.post.media_url}
                      alt="Post"
                      width={44}
                      height={44}
                      className="rounded object-cover"
                    />
                  </div>
                )}

                {/* Unread Badge */}
                {!notification.is_read && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                )}
              </button>
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

        {!hasMore && notifications.length > 0 && (
          <div className="py-8 text-center text-gray-500">
            You've reached the end
          </div>
        )}
      </div>
    </div>
  );
}

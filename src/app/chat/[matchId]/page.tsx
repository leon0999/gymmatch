'use client';

/**
 * GymMatch - Chat Page
 *
 * 1:1 실시간 채팅
 */

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

interface MessageWithSender extends Message {
  sender_name?: string;
}

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  user1_photo_session_approved: boolean;
  user2_photo_session_approved: boolean;
  matched_at: string;
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [isTogglingApproval, setIsTogglingApproval] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatData();
  }, [matchId]);

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (showMenu) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    // Mark messages as read when entering chat
    if (currentUser && messages.length > 0) {
      markMessagesAsRead();
    }
  }, [currentUser, messages]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Subscribe to realtime messages (INSERT and UPDATE)
    if (!matchId) return;

    const messagesChannel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          console.log('Message updated (read):', payload);
          const updatedMsg = payload.new as Message;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg))
          );
        }
      )
      .subscribe();

    console.log('Subscribed to realtime messages for match:', matchId);

    return () => {
      console.log('Unsubscribing from realtime messages');
      supabase.removeChannel(messagesChannel);
    };
  }, [matchId]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatData = async () => {
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

      // Get match details
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (matchError || !matchData) {
        setError('Match not found');
        return;
      }

      // Verify user is part of this match
      if (matchData.user1_id !== user.id && matchData.user2_id !== user.id) {
        setError('You are not part of this match');
        return;
      }

      // Save match data
      setMatch(matchData as Match);

      // Get other user's profile
      const otherUserId = matchData.user1_id === user.id ? matchData.user2_id : matchData.user1_id;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', otherUserId)
        .single();

      if (profileError || !profile) {
        setError('Could not load profile');
        return;
      }

      setOtherProfile(profile);

      // Load messages
      await loadMessages();
    } catch (err: any) {
      console.error('Error loading chat:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      // Mark all unread messages from other user as read
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('match_id', matchId)
        .neq('sender_id', currentUser.id)
        .is('read_at', null);

      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !currentUser) return;

    try {
      setSending(true);

      // Get current authenticated user (for RLS)
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        alert('Authentication error. Please log in again.');
        return;
      }

      console.log('Auth user ID:', authUser.id);
      console.log('Current user ID:', currentUser.id);
      console.log('Sending message with match_id:', matchId);

      const { data, error } = await supabase.from('messages').insert({
        match_id: matchId,
        sender_id: authUser.id, // Use authenticated user ID for RLS
        message: newMessage.trim(),
      });

      if (error) {
        console.error('Error sending message:', error);
        console.error('Error code:', error.code);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        alert(`Failed to send message: ${error.message || 'Unknown error'}`);
        return;
      }

      console.log('Message sent successfully:', data);

      // Clear input
      setNewMessage('');

      // Note: No need to reload messages - Realtime subscription will handle it
    } catch (err) {
      console.error('Error sending message (catch):', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleReport = async () => {
    if (!reportReason.trim() || !currentUser || !otherProfile) return;

    try {
      setIsReporting(true);

      // In a real app, you'd save this to a reports table
      // For now, we'll just show success and unmatch
      console.log('Reporting user:', otherProfile.user_id);
      console.log('Reason:', reportReason);

      // Unmatch after reporting
      await handleUnmatch();

      alert('User reported successfully. We\'ll review this report.');
      router.push('/matches');
    } catch (err) {
      console.error('Error reporting user:', err);
      alert('Failed to report user. Please try again.');
    } finally {
      setIsReporting(false);
      setShowReportModal(false);
      setReportReason('');
    }
  };

  const handleUnmatch = async () => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

      if (error) {
        console.error('Error unmatching:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error unmatching:', err);
      throw err;
    }
  };

  const handleBlock = async () => {
    if (!currentUser || !otherProfile) return;

    const confirmed = confirm(
      `Are you sure you want to block ${otherProfile.name}? You won't see each other anymore.`
    );

    if (!confirmed) return;

    try {
      // In a real app, you'd save this to a blocks table
      // For now, we'll just unmatch
      await handleUnmatch();

      alert(`${otherProfile.name} has been blocked.`);
      router.push('/matches');
    } catch (err) {
      console.error('Error blocking user:', err);
      alert('Failed to block user. Please try again.');
    }
  };

  const togglePhotoSessionApproval = async () => {
    if (!currentUser || !match) return;

    try {
      setIsTogglingApproval(true);

      // Determine which user is approving
      const isUser1 = match.user1_id === currentUser.id;
      const currentApprovalField = isUser1 ? 'user1_photo_session_approved' : 'user2_photo_session_approved';
      const currentApprovalStatus = isUser1 ? match.user1_photo_session_approved : match.user2_photo_session_approved;

      // Toggle approval
      const { data, error } = await supabase
        .from('matches')
        .update({ [currentApprovalField]: !currentApprovalStatus })
        .eq('id', matchId)
        .select('*')
        .single();

      if (error) {
        console.error('Error toggling approval:', error);
        alert('Failed to update approval. Please try again.');
        return;
      }

      // Update local state
      setMatch(data as Match);

      // Show success message
      if (!currentApprovalStatus) {
        alert(`Photo Session 승인 완료! ${otherProfile?.name}님이 승인하면 서로 사진을 올릴 수 있습니다.`);
      } else {
        alert('Photo Session 승인이 취소되었습니다.');
      }
    } catch (err) {
      console.error('Error toggling approval:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsTogglingApproval(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => router.push('/matches')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  if (!otherProfile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/matches')}
              className="text-teal-600 hover:text-teal-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center overflow-hidden">
              {otherProfile.photo_url ? (
                <img
                  src={otherProfile.photo_url}
                  alt={otherProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl">👤</span>
              )}
            </div>

            <div>
              <h2 className="font-bold text-gray-900">
                {otherProfile.name}, {otherProfile.age}
              </h2>
              <p className="text-sm text-gray-600">{otherProfile.location_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Photo Session Approval Button */}
            {match && (() => {
              const isUser1 = match.user1_id === currentUser?.id;
              const myApproval = isUser1 ? match.user1_photo_session_approved : match.user2_photo_session_approved;
              const otherApproval = isUser1 ? match.user2_photo_session_approved : match.user1_photo_session_approved;
              const bothApproved = myApproval && otherApproval;

              return (
                <button
                  onClick={togglePhotoSessionApproval}
                  disabled={isTogglingApproval}
                  className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ${
                    bothApproved
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : myApproval
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg hover:scale-105'
                  } ${isTogglingApproval ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {bothApproved ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      승인됨
                    </>
                  ) : myApproval ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      대기 중
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      승인하기
                    </>
                  )}
                </button>
              );
            })()}

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowReportModal(true);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Report User
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleBlock();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Block User
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="container mx-auto max-w-2xl space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-teal-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-gray-600">No messages yet</p>
              <p className="text-gray-500 text-sm mt-1">
                Say hi to {otherProfile.name}! 👋
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUser?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isMe
                        ? 'bg-teal-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm break-words">{msg.message}</p>
                    <div
                      className={`text-xs mt-1 flex items-center gap-1 ${
                        isMe ? 'text-teal-100' : 'text-gray-500'
                      }`}
                    >
                      <span>{formatTime(msg.created_at)}</span>
                      {isMe && msg.read_at && (
                        <svg
                          className="w-4 h-4 text-teal-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 sticky bottom-0">
        <div className="container mx-auto max-w-2xl">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-teal-600 focus:border-transparent text-gray-900 placeholder:text-gray-600"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className={`px-6 py-3 rounded-full font-semibold transition-colors ${
                !newMessage.trim() || sending
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-teal-600 text-white hover:bg-teal-700'
              }`}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Report User</h3>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Please tell us why you're reporting {otherProfile?.name}. We'll review this report and take appropriate action.
            </p>

            <div className="space-y-3 mb-4">
              {[
                'Inappropriate behavior',
                'Harassment or bullying',
                'Spam or scam',
                'Fake profile',
                'Other'
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                    reportReason === reason
                      ? 'border-teal-600 bg-teal-50 text-teal-900'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            {reportReason === 'Other' && (
              <textarea
                value={reportReason === 'Other' ? '' : reportReason}
                onChange={(e) => setReportReason(`Other: ${e.target.value}`)}
                placeholder="Please describe the issue..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent mb-4"
                rows={3}
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason || isReporting}
                className={`flex-1 px-4 py-3 font-semibold rounded-lg transition-colors ${
                  !reportReason || isReporting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isReporting ? 'Reporting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

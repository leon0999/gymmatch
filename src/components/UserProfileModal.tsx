'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Dumbbell, Calendar, Heart, UserPlus, UserMinus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface UserProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ userId, isOpen, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadProfile();
      checkFollowStatus();
    }
  }, [isOpen, userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      setIsFollowing(!!data);
    } catch (error) {
      // Not following
      setIsFollowing(false);
    }
  };

  const handleFollow = async () => {
    if (followLoading) return;

    try {
      setFollowLoading(true);

      // Get session token for Authorization header
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/users/${userId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
        headers,
        credentials: 'same-origin', // Include cookies as fallback
      });

      if (res.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : profile ? (
            <>
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-gray-900">Profile</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Profile Content */}
              <div className="p-6 space-y-6">
                {/* Profile Photo & Basic Info */}
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center overflow-hidden mb-4">
                    {profile.photo_url ? (
                      <img
                        src={profile.photo_url}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-5xl text-white">👤</span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{profile.name}, {profile.age}</h3>
                  <p className="text-gray-600 flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" />
                    {profile.location_name}
                  </p>
                </div>

                {/* Follow Button */}
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`w-full py-3 rounded-full font-bold flex items-center justify-center gap-2 transition-all ${
                    isFollowing
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg hover:scale-105'
                  } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-5 h-5" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Follow
                    </>
                  )}
                </button>

                {/* Bio */}
                {profile.bio && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">About</h4>
                    <p className="text-gray-700">{profile.bio}</p>
                  </div>
                )}

                {/* Gym */}
                {profile.gym && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Dumbbell className="w-5 h-5 text-emerald-600" />
                    <span>{profile.gym}</span>
                  </div>
                )}

                {/* Workout Stats */}
                {profile.strength_level && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Strength Level</h4>
                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium capitalize">
                      {profile.strength_level}
                    </span>
                  </div>
                )}

                {/* Workout Parts */}
                {profile.workout_parts && profile.workout_parts.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Favorite Workouts</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.workout_parts.map((part) => (
                        <span
                          key={part}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize"
                        >
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Workout Times */}
                {profile.workout_times && profile.workout_times.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Workout Times</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.workout_times.map((time) => (
                        <span
                          key={time}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm capitalize"
                        >
                          {time.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-gray-600">
              Profile not found
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

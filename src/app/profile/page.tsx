'use client';

/**
 * GymMatch - My Profile Page
 *
 * 내 프로필 정보 표시 및 수정
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('❌ No user found, redirecting to onboarding');
        router.push('/onboarding');
        return;
      }

      console.log('✅ User found:', user.id);

      // Get profile
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        setError('Could not load profile. Please try onboarding again.');
        return;
      }

      if (!data) {
        console.log('❌ No profile found, redirecting to onboarding');
        router.push('/onboarding');
        return;
      }

      console.log('✅ Profile loaded:', data.name);
      setProfile(data);
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
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
          <div className="space-y-2">
            <button
              onClick={loadProfile}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/onboarding')}
              className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Go to Onboarding
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            Logout
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Profile Header */}
          <div className="h-48 bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-6xl">👤</span>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="p-6">
            {/* Name and Basic Info */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {profile.name}, {profile.age}
              </h2>
              <p className="text-gray-600">
                {profile.location_name}
                {profile.gym && ` • ${profile.gym}`}
              </p>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Bio</h3>
                <p className="text-gray-700">{profile.bio}</p>
              </div>
            )}

            {/* Fitness Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
              <div>
                <div className="text-xs text-gray-500 mb-1">Fitness Level</div>
                <div className="font-semibold capitalize">{profile.fitness_level}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Gender</div>
                <div className="font-semibold capitalize">{profile.gender}</div>
              </div>
            </div>

            {/* Goals */}
            {profile.fitness_goals && profile.fitness_goals.length > 0 && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Fitness Goals</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.fitness_goals.map((goal, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium capitalize"
                    >
                      {goal.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Workout Styles */}
            {profile.workout_styles && profile.workout_styles.length > 0 && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Workout Styles</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.workout_styles.map((style, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize"
                    >
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preferences */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Match Preferences</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Partner Gender</span>
                  <span className="font-medium capitalize">{profile.partner_gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Age Range</span>
                  <span className="font-medium">
                    {profile.age_range?.[0]} - {profile.age_range?.[1]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Distance</span>
                  <span className="font-medium">{profile.max_distance} miles</span>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-500">
              <div className="flex justify-between mb-1">
                <span>Account Created</span>
                <span>{new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Premium Status</span>
                <span className={profile.is_premium ? 'text-teal-600 font-semibold' : ''}>
                  {profile.is_premium ? '✓ Active' : 'Free'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <Link
            href="/"
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-full hover:bg-gray-300 text-center"
          >
            Home
          </Link>
          <Link
            href="/discover"
            className="flex-1 px-6 py-3 bg-teal-600 text-white font-semibold rounded-full hover:bg-teal-700 text-center"
          >
            Discover
          </Link>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

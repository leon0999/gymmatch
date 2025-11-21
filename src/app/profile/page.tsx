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
import ProfilePostsGrid from '@/components/ProfilePostsGrid';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [postsCount, setPostsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Form state for editing
  const [editForm, setEditForm] = useState({
    name: '',
    age: 0,
    bio: '',
    location: '',
    fitness_level: '' as 'beginner' | 'intermediate' | 'advanced',
    fitness_goals: [] as string[],
    workout_styles: [] as string[],
    gym_name: '',
    photo_url: '',
    // PR and Workout Details
    bench_pr: null as number | null,
    squat_pr: null as number | null,
    deadlift_pr: null as number | null,
    overhead_press_pr: null as number | null,
    body_weight: null as number | null,
    workout_split: '',
    years_training: null as number | null,
    weekly_frequency: null as number | null,
    preferred_time: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadStats = async (userId: string) => {
    try {
      // Get posts count
      const { count: posts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${userId},photographer_id.eq.${userId}`);

      setPostsCount(posts || 0);

      // Get followers count
      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      setFollowersCount(followers || 0);

      // Get following count
      const { count: following } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      setFollowingCount(following || 0);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

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

      // Load stats
      await loadStats(user.id);

      // Initialize edit form with current profile data
      setEditForm({
        name: data.name || '',
        age: data.age || 0,
        bio: data.bio || '',
        location: data.location || '',
        fitness_level: data.fitness_level || 'beginner',
        fitness_goals: data.fitness_goals || [],
        workout_styles: data.workout_styles || [],
        gym_name: data.gym_name || '',
        photo_url: data.photo_url || '',
        bench_pr: data.bench_pr || null,
        squat_pr: data.squat_pr || null,
        deadlift_pr: data.deadlift_pr || null,
        overhead_press_pr: data.overhead_press_pr || null,
        body_weight: data.body_weight || null,
        workout_split: data.workout_split || '',
        years_training: data.years_training || null,
        weekly_frequency: data.weekly_frequency || null,
        preferred_time: data.preferred_time || '',
      });
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

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      '⚠️ WARNING: This will permanently delete your account and all your data.\n\n' +
      'This includes:\n' +
      '• Your profile\n' +
      '• All your matches\n' +
      '• All your messages\n' +
      '• All your likes\n\n' +
      'This action CANNOT be undone.\n\n' +
      'Are you absolutely sure you want to continue?'
    );

    if (!confirmed) return;

    const doubleCheck = prompt(
      'Type "DELETE" (in all caps) to confirm account deletion:'
    );

    if (doubleCheck !== 'DELETE') {
      alert('Account deletion cancelled.');
      return;
    }

    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete in order (to respect foreign key constraints)
      // 1. Delete messages
      await supabase.from('messages').delete().eq('sender_id', user.id);

      // 2. Delete matches
      await supabase.from('matches').delete().or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      // 3. Delete swipes
      await supabase.from('swipes').delete().or(`user_id.eq.${user.id},target_user_id.eq.${user.id}`);

      // 4. Delete profile
      await supabase.from('profiles').delete().eq('user_id', user.id);

      // 5. Delete auth user (this will cascade delete)
      const { error: deleteAuthError } = await supabase.rpc('delete_user');

      if (deleteAuthError) {
        console.error('Auth delete error:', deleteAuthError);
        // Even if auth delete fails, we've deleted the profile
        // So sign out and redirect
      }

      // Sign out
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();

      alert('Your account has been deleted. We\'re sorry to see you go!');
      router.push('/');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      alert('Failed to delete account: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate
      if (!editForm.name.trim()) {
        alert('Name is required');
        return;
      }

      if (editForm.age < 18 || editForm.age > 100) {
        alert('Age must be between 18 and 100');
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: editForm.name.trim(),
          age: editForm.age,
          bio: editForm.bio.trim(),
          location: editForm.location.trim(),
          fitness_level: editForm.fitness_level,
          fitness_goals: editForm.fitness_goals,
          workout_styles: editForm.workout_styles,
          gym_name: editForm.gym_name.trim(),
          photo_url: editForm.photo_url,
          bench_pr: editForm.bench_pr,
          squat_pr: editForm.squat_pr,
          deadlift_pr: editForm.deadlift_pr,
          overhead_press_pr: editForm.overhead_press_pr,
          body_weight: editForm.body_weight,
          workout_split: editForm.workout_split,
          years_training: editForm.years_training,
          weekly_frequency: editForm.weekly_frequency,
          preferred_time: editForm.preferred_time,
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        alert('Failed to update profile: ' + updateError.message);
        return;
      }

      // Reload profile
      await loadProfile();
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      alert('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to current profile data
    if (profile) {
      setEditForm({
        name: profile.name || '',
        age: profile.age || 0,
        bio: profile.bio || '',
        location: profile.location || '',
        fitness_level: profile.fitness_level || 'beginner',
        fitness_goals: profile.fitness_goals || [],
        workout_styles: profile.workout_styles || [],
        gym_name: profile.gym_name || '',
        photo_url: profile.photo_url || '',
        bench_pr: profile.bench_pr || null,
        squat_pr: profile.squat_pr || null,
        deadlift_pr: profile.deadlift_pr || null,
        overhead_press_pr: profile.overhead_press_pr || null,
        body_weight: profile.body_weight || null,
        workout_split: profile.workout_split || '',
        years_training: profile.years_training || null,
        weekly_frequency: profile.weekly_frequency || null,
        preferred_time: profile.preferred_time || '',
      });
    }
    setIsEditing(false);
  };

  const toggleFitnessGoal = (goal: string) => {
    setEditForm(prev => ({
      ...prev,
      fitness_goals: prev.fitness_goals.includes(goal)
        ? prev.fitness_goals.filter(g => g !== goal)
        : [...prev.fitness_goals, goal],
    }));
  };

  const toggleWorkoutStyle = (style: string) => {
    setEditForm(prev => ({
      ...prev,
      workout_styles: prev.workout_styles.includes(style)
        ? prev.workout_styles.filter(s => s !== style)
        : [...prev.workout_styles, style],
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload photo: ' + uploadError.message);
        return;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      // Update profile with photo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photo_url: data.publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        alert('Failed to update profile');
        return;
      }

      // Reload profile
      await loadProfile();
    } catch (err) {
      console.error('Error uploading photo:', err);
      alert('Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
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
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-4 max-w-2xl pb-20">
        {/* Instagram Style Header */}
        <div className="flex items-center justify-between mb-6 px-2">
          <h1 className="text-xl font-semibold text-gray-900">{profile.name}</h1>
        </div>

        {/* Instagram Profile Section */}
        <div className="mb-6">
          {/* Profile Photo + Stats */}
          <div className="flex items-center px-4 mb-4">
            {/* Profile Photo */}
            <div className="mr-8">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                {profile.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-4xl">👤</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 flex justify-around">
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-900">{postsCount}</div>
                <div className="text-sm text-gray-600">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-900">{followersCount}</div>
                <div className="text-sm text-gray-600">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-gray-900">{followingCount}</div>
                <div className="text-sm text-gray-600">Following</div>
              </div>
            </div>
          </div>

          {/* Name and Bio */}
          <div className="px-4 mb-4">
            <h2 className="font-semibold text-gray-900">{profile.name}</h2>
            {profile.bio && (
              <p className="text-sm text-gray-900 mt-1">{profile.bio}</p>
            )}
            {profile.gym && (
              <p className="text-sm text-gray-600 mt-1">{profile.gym}</p>
            )}
          </div>

          {/* Edit Profile Button */}
          {!isEditing && (
            <div className="px-4">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* Settings Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Photo Upload Section */}
              <div className="p-6 border-b border-gray-200">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 overflow-hidden border-4 border-gray-200">
                    {editForm.photo_url ? (
                      <img
                        src={editForm.photo_url}
                        alt={editForm.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-6xl">👤</span>
                    )}
                  </div>
                  <label className="cursor-pointer inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white text-sm font-medium transition-colors">
                    {uploading ? 'Uploading...' : 'Change Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Edit Form */}
              <div className="p-6">
                <div className="space-y-6">
                {/* Name and Age */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Age *
                    </label>
                    <input
                      type="number"
                      value={editForm.age || ''}
                      onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      placeholder="Age"
                      min="18"
                      max="100"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                    placeholder="City, State"
                  />
                </div>

                {/* Gym */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Gym
                  </label>
                  <input
                    type="text"
                    value={editForm.gym_name}
                    onChange={(e) => setEditForm({ ...editForm, gym_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                    placeholder="Your gym name"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                    placeholder="Tell others about yourself..."
                    rows={3}
                  />
                </div>

                {/* Fitness Level */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fitness Level
                  </label>
                  <select
                    value={editForm.fitness_level}
                    onChange={(e) => setEditForm({ ...editForm, fitness_level: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-gray-900 capitalize"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                {/* Fitness Goals */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fitness Goals
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['lose_weight', 'build_muscle', 'improve_endurance', 'get_toned', 'stay_active', 'train_for_event'].map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => toggleFitnessGoal(goal)}
                        className={`px-3 py-1 rounded-full text-sm font-medium capitalize transition-colors ${
                          editForm.fitness_goals.includes(goal)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {goal.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Workout Styles */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Workout Styles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['weightlifting', 'cardio', 'yoga', 'crossfit', 'pilates', 'sports', 'running', 'cycling', 'swimming'].map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => toggleWorkoutStyle(style)}
                        className={`px-3 py-1 rounded-full text-sm font-medium capitalize transition-colors ${
                          editForm.workout_styles.includes(style)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Records (PRs)</h3>
                  <p className="text-sm text-gray-600 mb-4">Track your 1RM (One Rep Max) in lbs</p>
                </div>

                {/* Body Weight */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Body Weight (lbs)
                  </label>
                  <input
                    type="number"
                    value={editForm.body_weight || ''}
                    onChange={(e) => setEditForm({ ...editForm, body_weight: parseInt(e.target.value) || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                    placeholder="170"
                  />
                </div>

                {/* PRs Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bench Press
                    </label>
                    <input
                      type="number"
                      value={editForm.bench_pr || ''}
                      onChange={(e) => setEditForm({ ...editForm, bench_pr: parseInt(e.target.value) || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      placeholder="225 lbs"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Squat
                    </label>
                    <input
                      type="number"
                      value={editForm.squat_pr || ''}
                      onChange={(e) => setEditForm({ ...editForm, squat_pr: parseInt(e.target.value) || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      placeholder="315 lbs"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Deadlift
                    </label>
                    <input
                      type="number"
                      value={editForm.deadlift_pr || ''}
                      onChange={(e) => setEditForm({ ...editForm, deadlift_pr: parseInt(e.target.value) || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      placeholder="405 lbs"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Overhead Press
                    </label>
                    <input
                      type="number"
                      value={editForm.overhead_press_pr || ''}
                      onChange={(e) => setEditForm({ ...editForm, overhead_press_pr: parseInt(e.target.value) || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      placeholder="135 lbs"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Training Details</h3>
                </div>

                {/* Workout Split */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Workout Split
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'PPL', label: 'Push/Pull/Legs' },
                      { key: 'Upper/Lower', label: 'Upper/Lower' },
                      { key: 'Bro Split', label: 'Bro Split' },
                      { key: 'Full Body', label: 'Full Body' },
                      { key: 'PHUL', label: 'PHUL' },
                      { key: 'Custom', label: 'Custom' },
                    ].map((split) => (
                      <button
                        key={split.key}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, workout_split: split.key })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          editForm.workout_split === split.key
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {split.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Years Training + Weekly Frequency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Years Training
                    </label>
                    <input
                      type="number"
                      value={editForm.years_training || ''}
                      onChange={(e) => setEditForm({ ...editForm, years_training: parseInt(e.target.value) || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      placeholder="3"
                      min="0"
                      max="50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Weekly Frequency
                    </label>
                    <select
                      value={editForm.weekly_frequency || ''}
                      onChange={(e) => setEditForm({ ...editForm, weekly_frequency: parseInt(e.target.value) || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                    >
                      <option value="">Select...</option>
                      <option value="3">3x/week</option>
                      <option value="4">4x/week</option>
                      <option value="5">5x/week</option>
                      <option value="6">6x/week</option>
                      <option value="7">7x/week</option>
                    </select>
                  </div>
                </div>

                {/* Preferred Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Preferred Training Time
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'morning', label: 'Morning (6-9am)' },
                      { key: 'midday', label: 'Midday (12-2pm)' },
                      { key: 'evening', label: 'Evening (5-8pm)' },
                      { key: 'night', label: 'Night (8-11pm)' },
                    ].map((time) => (
                      <button
                        key={time.key}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, preferred_time: time.key })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          editForm.preferred_time === time.key
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {time.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save/Cancel Buttons */}
                <div className="space-y-3 pt-4">
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex-1 px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Logout
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full px-6 py-3 border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
            </div>
          </div>
        )}

        {/* Tabs and Photo Grid */}
        <div className="border-t border-gray-200">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button className="flex-1 py-3 text-gray-900 border-b-2 border-gray-900">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4h7V11H4zm0 9h7v7H4zm9-9h7V11h-7zm0 9h7v7h-7z" />
                </svg>
                <span className="text-sm font-medium">Posts</span>
              </div>
            </button>
          </div>

          {/* Photo Grid */}
          <ProfilePostsGrid userId={profile.user_id} />
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

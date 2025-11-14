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

  // Form state for editing
  const [editForm, setEditForm] = useState({
    name: '',
    age: 0,
    bio: '',
    location_name: '',
    fitness_level: '' as 'beginner' | 'intermediate' | 'advanced',
    fitness_goals: [] as string[],
    workout_styles: [] as string[],
    gym: '',
  });

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

      // Initialize edit form with current profile data
      setEditForm({
        name: data.name || '',
        age: data.age || 0,
        bio: data.bio || '',
        location_name: data.location_name || '',
        fitness_level: data.fitness_level || 'beginner',
        fitness_goals: data.fitness_goals || [],
        workout_styles: data.workout_styles || [],
        gym: data.gym || '',
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
          location_name: editForm.location_name.trim(),
          fitness_level: editForm.fitness_level,
          fitness_goals: editForm.fitness_goals,
          workout_styles: editForm.workout_styles,
          gym: editForm.gym.trim(),
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
      alert('Profile updated successfully!');
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
        location_name: profile.location_name || '',
        fitness_level: profile.fitness_level || 'beginner',
        fitness_goals: profile.fitness_goals || [],
        workout_styles: profile.workout_styles || [],
        gym: profile.gym || '',
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
      alert('Photo uploaded successfully!');
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
      <div className="container mx-auto px-4 py-4 max-w-2xl">
        {/* Header with Settings Icon */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
          <div className="flex gap-3">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Settings"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Profile Header */}
          <div className="h-48 bg-emerald-500 flex items-center justify-center relative">
            <div className="text-center">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 overflow-hidden">
                {profile.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-6xl">👤</span>
                )}
              </div>
              <label className="cursor-pointer inline-block px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-white text-sm font-medium transition-colors">
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

          {/* Profile Info */}
          <div className="p-6">
            {isEditing ? (
              /* Edit Mode */
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
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
                    value={editForm.location_name}
                    onChange={(e) => setEditForm({ ...editForm, location_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    placeholder="City, State"
                  />
                </div>

                {/* Gym */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gym
                  </label>
                  <input
                    type="text"
                    value={editForm.gym}
                    onChange={(e) => setEditForm({ ...editForm, gym: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent capitalize"
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

                {/* Save/Cancel Buttons */}
                <div className="space-y-3 pt-4">
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex-1 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <>
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
              </>
            )}

            {!isEditing && (
              <>
                {/* Goals */}
                {profile.fitness_goals && profile.fitness_goals.length > 0 && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Fitness Goals</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.fitness_goals.map((goal, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium capitalize"
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
                          className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium capitalize"
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
                    <span className={profile.is_premium ? 'text-emerald-600 font-semibold' : ''}>
                      {profile.is_premium ? '✓ Active' : 'Free'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Workout Photos Grid */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Workout Photos</h2>
            <p className="text-sm text-gray-500 mt-1">
              Photos taken by your workout partners
            </p>
          </div>
          <ProfilePostsGrid userId={profile.user_id} />
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-lg font-bold text-red-900 mb-1">Danger Zone</h3>
              <p className="text-sm text-red-700">
                Deleting your account is permanent and cannot be undone. All your data, matches, and messages will be permanently deleted.
              </p>
            </div>
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={loading}
            className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Deleting...' : 'Delete My Account'}
          </button>
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
            className="flex-1 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-full hover:bg-emerald-700 text-center"
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

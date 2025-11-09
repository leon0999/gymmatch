'use client';

/**
 * Test Page: Supabase Anonymous Authentication
 *
 * 이 페이지는 익명 인증이 정상 작동하는지 테스트합니다.
 */

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestAuthPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAnonymousAuth = async () => {
    try {
      setLoading(true);
      setResult(null);

      console.log('🔐 Testing anonymous sign-in...');

      const { data, error } = await supabase.auth.signInAnonymously();

      console.log('Auth result:', { data, error });

      if (error) {
        setResult({
          success: false,
          error: error.message,
          details: error,
        });
      } else {
        setResult({
          success: true,
          user: data.user,
          session: data.session,
        });
      }
    } catch (err: any) {
      console.error('Test error:', err);
      setResult({
        success: false,
        error: err.message,
        details: err,
      });
    } finally {
      setLoading(false);
    }
  };

  const testProfileInsert = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setResult({ success: false, error: 'No user logged in' });
        return;
      }

      console.log('📝 Testing profile insert for user:', user.id);

      // Try to insert profile
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          name: 'Test User',
          age: 25,
          gender: 'male',
          bio: 'Test bio',
          location: 'POINT(-73.9712 40.7831)', // NYC
          location_name: 'Manhattan',
          gym: '24 Hour Fitness',
          fitness_level: 'beginner',
          fitness_goals: ['muscle'],
          workout_styles: ['powerlifting'],
          schedule: [{ day: 'Monday', startTime: '06:00', endTime: '09:00' }],
          partner_gender: 'same',
          age_range: [22, 35],
          max_distance: 5,
          level_match: 'any',
          is_premium: false,
          photos: [],
        })
        .select()
        .single();

      console.log('Insert result:', { data, error });

      if (error) {
        setResult({
          success: false,
          error: error.message,
          details: error,
        });
      } else {
        setResult({
          success: true,
          profile: data,
        });
      }
    } catch (err: any) {
      console.error('Test error:', err);
      setResult({
        success: false,
        error: err.message,
        details: err,
      });
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentUser = async () => {
    try {
      setLoading(true);

      const { data: { user }, error } = await supabase.auth.getUser();

      console.log('Current user:', { user, error });

      setResult({
        success: !error,
        user,
        error: error?.message,
      });
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setResult({ success: true, message: 'Signed out successfully' });
    } catch (err: any) {
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Supabase Auth Test
        </h1>

        <div className="space-y-4 mb-8">
          <button
            onClick={testAnonymousAuth}
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Testing...' : '1. Test Anonymous Sign-In'}
          </button>

          <button
            onClick={checkCurrentUser}
            disabled={loading}
            className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Checking...' : '2. Check Current User'}
          </button>

          <button
            onClick={testProfileInsert}
            disabled={loading}
            className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Testing...' : '3. Test Profile Insert'}
          </button>

          <button
            onClick={signOut}
            disabled={loading}
            className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing out...' : '4. Sign Out'}
          </button>
        </div>

        {result && (
          <div className={`p-6 rounded-lg ${
            result.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
          }`}>
            <h2 className={`text-xl font-bold mb-4 ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.success ? '✅ Success' : '❌ Error'}
            </h2>

            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-sm font-mono">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <h3 className="text-lg font-bold text-blue-900 mb-2">
            📋 Instructions
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>먼저 "Test Anonymous Sign-In" 클릭</li>
            <li>성공하면 "Check Current User" 클릭</li>
            <li>user_id 확인 후 "Test Profile Insert" 클릭</li>
            <li>모든 테스트 후 "Sign Out" 클릭</li>
          </ol>
        </div>

        <div className="mt-4">
          <a
            href="/onboarding"
            className="text-blue-600 hover:underline"
          >
            ← Back to Onboarding
          </a>
        </div>
      </div>
    </div>
  );
}

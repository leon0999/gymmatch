'use client';

/**
 * Test Page: Quick Logout & Account Switcher
 */

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function TestLogoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();

      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();

      alert('✅ Logged out successfully!');

      // Redirect to home
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
      alert('Error logging out');
    } finally {
      setLoading(false);
    }
  };

  const createNewAccount = () => {
    handleLogout().then(() => {
      setTimeout(() => {
        router.push('/onboarding');
      }, 500);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          🔑 Account Manager
        </h1>

        <div className="space-y-4">
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging out...' : '🚪 Logout'}
          </button>

          <button
            onClick={createNewAccount}
            disabled={loading}
            className="w-full px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : '➕ Logout & Create New Account'}
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"
          >
            ← Back to Home
          </button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-2">📋 사용 방법</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. "Logout" → 현재 계정 로그아웃</li>
            <li>2. "Logout & Create New Account" → 로그아웃 후 온보딩으로 이동</li>
            <li>3. 여러 계정 테스트 시 시크릿 모드 사용 권장</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

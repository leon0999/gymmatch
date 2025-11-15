'use client';

/**
 * GymMatch - Login Page
 *
 * 실제 이메일/비밀번호로 로그인
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      // Validate
      if (!email || !password) {
        setError('Please enter email and password');
        setIsSubmitting(false);
        return;
      }

      console.log('🔐 Logging in with email:', email);

      // Sign in
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !data.user) {
        console.error('❌ Login error:', authError);
        setError(authError?.message || 'Login failed. Please check your credentials.');
        setIsSubmitting(false);
        return;
      }

      console.log('✅ Login successful:', data.user.id);

      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (!profile) {
        // No profile yet - redirect to onboarding
        console.log('⚠️ No profile found, redirecting to onboarding');
        router.push('/onboarding');
        return;
      }

      // Profile exists - redirect to feed
      console.log('✅ Profile found, redirecting to feed');
      router.push('/feed');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-4xl font-bold">
              Gym<span className="text-teal-600">Match</span>
            </h1>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
          <p className="text-gray-600 mt-2">Log in to find your gym partners</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full px-6 py-3 text-white font-semibold rounded-lg transition-colors ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              {isSubmitting ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link
              href="/onboarding"
              className="text-teal-600 hover:text-teal-700 font-semibold"
            >
              Sign Up
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

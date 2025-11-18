'use client';

/**
 * GymMatch - Sign Up Page (Step 0)
 *
 * 이메일/비밀번호만 받고 온보딩으로 이동
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      // Validate
      if (!email || !password || !confirmPassword) {
        setError('Please fill in all fields');
        setIsSubmitting(false);
        return;
      }

      // Email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setIsSubmitting(false);
        return;
      }

      // Password length
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setIsSubmitting(false);
        return;
      }

      // Password match
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsSubmitting(false);
        return;
      }

      console.log('🔐 Creating account with email:', email);

      // Sign up
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            created_at: new Date().toISOString(),
          }
        }
      });

      if (authError || !data.user) {
        console.error('❌ Sign up error:', authError);
        setError(authError?.message || 'Sign up failed. Please try again.');
        setIsSubmitting(false);
        return;
      }

      console.log('✅ Account created:', data.user.id);

      // 온보딩으로 이동 (프로필 생성)
      router.push('/onboarding');
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-8">
            <h1 className="text-5xl font-extrabold">
              Gym<span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Match</span>
            </h1>
          </Link>
          <h2 className="text-4xl font-bold text-gray-900 mb-3">Create Account</h2>
          <p className="text-lg text-gray-600">
            Join and find your perfect gym partner
          </p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent text-gray-900 placeholder:text-gray-600"
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
                placeholder="At least 6 characters"
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent text-gray-900 placeholder:text-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent text-gray-900 placeholder:text-gray-600"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full px-6 py-4 text-white text-xl font-bold rounded-xl transition-all shadow-xl ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 hover:scale-105 transform'
              }`}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            By signing up, you agree to our Terms & Privacy Policy
          </div>
        </div>

        {/* Log In Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-teal-600 hover:text-teal-700 font-semibold"
            >
              Log In
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

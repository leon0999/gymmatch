'use client';

/**
 * GymMatch - Landing Page (with Auth State)
 *
 * 로그인 상태에 따라 다른 UI 표시
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Get profile name
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          // Redirect logged-in users to feed
          router.push('/feed');
          return;
        }
      }
    } catch (err) {
      console.error('Auth check error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Not logged in view (original landing page)
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center text-center max-w-5xl mx-auto">
          {/* Logo & Tagline */}
          <div className="mb-10">
            <h1 className="text-7xl md:text-8xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Gym<span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Match</span>
            </h1>
            <p className="text-3xl md:text-4xl text-gray-700 font-bold mb-4">
              Find Your Perfect Gym Partner
            </p>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              The fitness dating app for gym-goers
            </p>
          </div>

          {/* Value Proposition */}
          <div className="mb-12 max-w-3xl">
            <p className="text-2xl text-gray-800 leading-relaxed font-medium">
              Stop working out alone. Match with gym partners based on{' '}
              <span className="font-bold text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text">location</span>,{' '}
              <span className="font-bold text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text">schedule</span>, and{' '}
              <span className="font-bold text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text">fitness goals</span>.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link
              href="/signup"
              className="px-12 py-5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xl font-bold rounded-full hover:from-teal-700 hover:to-emerald-700 transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="px-12 py-5 bg-white text-teal-600 text-xl font-semibold rounded-full border-2 border-teal-600 hover:bg-teal-50 transition-all hover:scale-105 transform shadow-md"
            >
              Log In
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 w-full mt-8 mb-20">
            <div className="group bg-gradient-to-br from-white to-teal-50 p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 border border-teal-100">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                📍
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Nearby Partners
              </h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                Find gym buddies within 1-5 miles. Same gym? Even better!
              </p>
            </div>

            <div className="group bg-gradient-to-br from-white to-emerald-50 p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 border border-emerald-100">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                ⏰
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Perfect Timing
              </h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                Match based on your weekly workout schedule. No more empty gyms.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-white to-teal-50 p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 border border-teal-100">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                🎯
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Shared Goals
              </h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                Connect with partners who have similar fitness goals and workout styles.
              </p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-12 p-8 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-3xl shadow-2xl max-w-3xl">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-2xl">⭐⭐⭐⭐⭐</span>
            </div>
            <p className="text-2xl font-bold mb-3">
              Join 1,000+ gym-goers finding workout partners
            </p>
            <p className="text-xl text-teal-50 italic">
              "Best decision ever! My workout partner keeps me accountable and motivated."
            </p>
            <p className="text-teal-100 mt-2 font-semibold">
              - Sarah, NYC
            </p>
          </div>

          {/* How It Works */}
          <div id="how-it-works" className="mt-24 w-full bg-gradient-to-b from-white to-gray-50 -mx-4 px-4 py-16 rounded-3xl">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-16 text-center">
              How GymMatch Works
            </h2>
            <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-500 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  1
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Create Profile
                </h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  Add your fitness level, goals, and schedule
                </p>
              </div>

              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-500 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Swipe & Match
                </h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  See compatible partners with match scores
                </p>
              </div>

              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-500 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Chat & Plan
                </h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  Message matches and schedule workouts
                </p>
              </div>

              <div className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-500 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  4
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Workout Together
                </h3>
                <p className="text-gray-600 text-base leading-relaxed">
                  Meet at the gym and crush your goals
                </p>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="mt-24 mb-12">
            <Link
              href="/signup"
              className="px-16 py-6 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-2xl font-bold rounded-full hover:from-teal-700 hover:to-emerald-700 transition-all shadow-2xl hover:shadow-3xl inline-block hover:scale-105 transform"
            >
              Start Finding Partners Now
            </Link>
            <p className="text-gray-600 mt-6 text-lg font-medium">
              Free to start • Unlimited matches • No credit card required
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8 mb-20">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2025 GymMatch. All rights reserved.</p>
          <p className="text-sm mt-2">
            Made with 💪 for gym-goers everywhere
          </p>
        </div>
      </footer>

    </div>
  );
}

/**
 * GymMatch - Landing Page
 *
 * Hero section with value proposition and call-to-action
 */

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
          {/* Logo & Tagline */}
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">
              Gym<span className="text-teal-600">Match</span>
            </h1>
            <p className="text-2xl text-gray-600 font-medium">
              Find Your Perfect Gym Partner
            </p>
          </div>

          {/* Value Proposition */}
          <p className="text-xl text-gray-700 mb-12 max-w-2xl leading-relaxed">
            Stop working out alone. Match with gym partners based on{' '}
            <span className="font-semibold text-teal-600">location</span>,{' '}
            <span className="font-semibold text-teal-600">schedule</span>, and{' '}
            <span className="font-semibold text-teal-600">fitness goals</span>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link
              href="/onboarding"
              className="px-8 py-4 bg-teal-600 text-white text-lg font-semibold rounded-full hover:bg-teal-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Get Started Free
            </Link>
            <Link
              href="/discover"
              className="px-8 py-4 bg-white text-teal-600 text-lg font-semibold rounded-full border-2 border-teal-600 hover:bg-teal-50 transition-colors"
            >
              See How It Works
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 w-full mt-8">
            {/* Feature 1: Location */}
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Nearby Partners
              </h3>
              <p className="text-gray-600">
                Find gym buddies within 1-5 miles. Same gym? Even better!
              </p>
            </div>

            {/* Feature 2: Schedule */}
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Perfect Timing
              </h3>
              <p className="text-gray-600">
                Match based on your weekly workout schedule. No more empty gyms.
              </p>
            </div>

            {/* Feature 3: Goals */}
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Shared Goals
              </h3>
              <p className="text-gray-600">
                Connect with partners who have similar fitness goals and workout styles.
              </p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-16 p-6 bg-teal-600 text-white rounded-2xl shadow-lg max-w-2xl">
            <p className="text-lg font-semibold mb-2">
              Join 1,000+ gym-goers finding workout partners
            </p>
            <p className="text-teal-100">
              "Best decision ever! My workout partner keeps me accountable and motivated." - Sarah, NYC
            </p>
          </div>

          {/* How It Works */}
          <div className="mt-20 w-full">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">
              How GymMatch Works
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Create Profile
                </h3>
                <p className="text-gray-600 text-sm">
                  Add your fitness level, goals, and schedule
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Swipe & Match
                </h3>
                <p className="text-gray-600 text-sm">
                  See compatible partners with match scores
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Chat & Plan
                </h3>
                <p className="text-gray-600 text-sm">
                  Message matches and schedule workouts
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  4
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Workout Together
                </h3>
                <p className="text-gray-600 text-sm">
                  Meet at the gym and crush your goals
                </p>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="mt-20 mb-8">
            <Link
              href="/onboarding"
              className="px-12 py-5 bg-teal-600 text-white text-xl font-bold rounded-full hover:bg-teal-700 transition-colors shadow-xl hover:shadow-2xl inline-block"
            >
              Start Finding Partners Now
            </Link>
            <p className="text-gray-500 mt-4">
              Free to start • 3 matches per day • No credit card required
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
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

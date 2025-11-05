/**
 * GymMatch - Discover Page
 *
 * Main swipe/match interface
 * Shows potential gym partners with match scores
 */

'use client';

import Link from 'next/link';

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Discover Partners
          </h1>
          <Link
            href="/"
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            Home
          </Link>
        </div>

        {/* Success Message */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-teal-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Profile Created Successfully!
            </h2>

            <p className="text-lg text-gray-600 mb-8">
              Your profile has been saved to the database. You're ready to start
              matching with gym partners!
            </p>

            <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 mb-8">
              <h3 className="font-bold text-teal-900 mb-3">What's Next?</h3>
              <ul className="text-left text-teal-800 space-y-2">
                <li className="flex items-start">
                  <span className="font-bold mr-2">1.</span>
                  <span>We'll show you potential gym partners based on your preferences</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">2.</span>
                  <span>Swipe right on people you'd like to work out with</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">3.</span>
                  <span>When you both swipe right, it's a match!</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">4.</span>
                  <span>Message your matches and schedule workouts together</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="text-sm text-gray-500 italic">
                Coming soon: Swipe interface with match scores
              </div>

              <Link
                href="/"
                className="inline-block px-8 py-3 bg-teal-600 text-white font-semibold rounded-full hover:bg-teal-700 transition-colors shadow-lg"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

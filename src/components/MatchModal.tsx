'use client';

/**
 * GymMatch - Match Success Modal
 *
 * Full-screen celebration modal when mutual match occurs
 */

import { useRouter } from 'next/navigation';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface MatchModalProps {
  isOpen: boolean;
  matchedUser: Profile | null;
  matchId: string | null;
  onClose: () => void;
}

export default function MatchModal({ isOpen, matchedUser, matchId, onClose }: MatchModalProps) {
  const router = useRouter();

  if (!isOpen || !matchedUser) return null;

  const handleSendMessage = () => {
    if (matchId) {
      router.push(`/chat/${matchId}`);
    }
  };

  const handleKeepSwiping = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scaleIn">
        {/* Celebration Header */}
        <div className="bg-gradient-to-br from-teal-500 to-blue-600 px-8 py-12 text-center">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h1 className="text-3xl font-bold text-white mb-2">It's a Match!</h1>
          <p className="text-teal-50 text-sm">
            You and {matchedUser.name} liked each other
          </p>
        </div>

        {/* Profile Preview */}
        <div className="px-8 py-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-3xl">👤</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">
                {matchedUser.name}, {matchedUser.age}
              </h3>
              <p className="text-gray-600 text-sm">
                {matchedUser.location_name}
              </p>
              <p className="text-teal-600 text-sm font-medium mt-1">
                🏋️ {matchedUser.gym}
              </p>
            </div>
          </div>

          {/* Shared Interests */}
          {matchedUser.workout_style && (
            <div className="bg-teal-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Shared Interest:</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-teal-600 text-white text-sm rounded-full">
                  {matchedUser.workout_style}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSendMessage}
              className="w-full px-6 py-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-semibold rounded-full hover:from-teal-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Send a Message
            </button>
            <button
              onClick={handleKeepSwiping}
              className="w-full px-6 py-4 bg-white text-gray-700 font-semibold rounded-full border-2 border-gray-300 hover:border-gray-400 transition-all"
            >
              Keep Swiping
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

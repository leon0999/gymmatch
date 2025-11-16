'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Dumbbell } from 'lucide-react';

interface TodayWorkoutPopupProps {
  onClose: () => void;
  onSelect: (focus: string) => void;
}

const WORKOUT_OPTIONS = [
  { value: 'chest', label: 'Chest', emoji: '💪', gradient: 'from-red-500 to-pink-500' },
  { value: 'back', label: 'Back', emoji: '🔥', gradient: 'from-orange-500 to-red-500' },
  { value: 'legs', label: 'Legs', emoji: '🦵', gradient: 'from-blue-500 to-cyan-500' },
  { value: 'shoulders', label: 'Shoulders', emoji: '🏋️', gradient: 'from-purple-500 to-pink-500' },
  { value: 'arms', label: 'Arms', emoji: '💪', gradient: 'from-emerald-500 to-teal-500' },
  { value: 'core', label: 'Core', emoji: '⚡', gradient: 'from-yellow-500 to-orange-500' },
  { value: 'cardio', label: 'Cardio', emoji: '🏃', gradient: 'from-green-500 to-emerald-500' },
  { value: 'any', label: 'Any Workout', emoji: '✨', gradient: 'from-gray-500 to-gray-700' },
];

export default function TodayWorkoutPopup({ onClose, onSelect }: TodayWorkoutPopupProps) {
  const [selecting, setSelecting] = useState(false);
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null);

  const handleSelect = async (focus: string) => {
    setSelectedFocus(focus);
    setSelecting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to continue');
        return;
      }

      // Update user's today workout focus
      const { error } = await supabase
        .from('profiles')
        .update({
          today_workout_focus: focus,
          workout_focus_updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to update workout focus:', error);
        alert('Failed to save. Please try again.');
        setSelecting(false);
        setSelectedFocus(null);
        return;
      }

      // Success!
      onSelect(focus);

      // Close after short delay
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (error) {
      console.error('Error updating workout focus:', error);
      alert('Something went wrong. Please try again.');
      setSelecting(false);
      setSelectedFocus(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={selecting}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl mb-4">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            What's your focus today?
          </h2>
          <p className="text-gray-600">
            We'll prioritize partners training the same muscle group
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {WORKOUT_OPTIONS.map((option) => {
            const isSelected = selectedFocus === option.value;

            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                disabled={selecting}
                className={`
                  relative flex flex-col items-center gap-2 p-4 rounded-2xl
                  border-2 transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 scale-95'
                      : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 active:scale-95'
                  }
                `}
              >
                {/* Emoji */}
                <div className={`
                  flex items-center justify-center w-14 h-14 rounded-xl
                  bg-gradient-to-br ${option.gradient}
                  text-3xl
                  ${isSelected ? 'scale-110' : ''}
                  transition-transform duration-200
                `}>
                  {option.emoji}
                </div>

                {/* Label */}
                <span className={`
                  font-semibold text-sm
                  ${isSelected ? 'text-emerald-700' : 'text-gray-900'}
                `}>
                  {option.label}
                </span>

                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Loading state */}
        {selecting && (
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-2 text-emerald-600">
              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Saving your preference...</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center mt-4">
          💡 Tip: You can change this anytime from Settings
        </p>
      </div>
    </div>
  );
}

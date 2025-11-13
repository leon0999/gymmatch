'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';

export interface DiscoverFilterOptions {
  workoutParts: string[];
  strengthLevels: string[];
  minAge?: number;
  maxAge?: number;
}

interface DiscoverFiltersProps {
  filters: DiscoverFilterOptions;
  onFiltersChange: (filters: DiscoverFilterOptions) => void;
}

const WORKOUT_PARTS = [
  { value: 'chest', label: 'Chest', emoji: '💪' },
  { value: 'back', label: 'Back', emoji: '🏋️' },
  { value: 'legs', label: 'Legs', emoji: '🦵' },
  { value: 'shoulders', label: 'Shoulders', emoji: '💪' },
  { value: 'arms', label: 'Arms', emoji: '💪' },
  { value: 'core', label: 'Core', emoji: '🧘' },
  { value: 'cardio', label: 'Cardio', emoji: '🏃' },
];

const STRENGTH_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'Just starting out' },
  { value: 'intermediate', label: 'Intermediate', description: 'Regular gym-goer' },
  { value: 'advanced', label: 'Advanced', description: 'Experienced lifter' },
];

export default function DiscoverFilters({ filters, onFiltersChange }: DiscoverFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<DiscoverFilterOptions>(filters);

  const toggleWorkoutPart = (part: string) => {
    const newParts = localFilters.workoutParts.includes(part)
      ? localFilters.workoutParts.filter(p => p !== part)
      : [...localFilters.workoutParts, part];
    setLocalFilters({ ...localFilters, workoutParts: newParts });
  };

  const toggleStrengthLevel = (level: string) => {
    const newLevels = localFilters.strengthLevels.includes(level)
      ? localFilters.strengthLevels.filter(l => l !== level)
      : [...localFilters.strengthLevels, level];
    setLocalFilters({ ...localFilters, strengthLevels: newLevels });
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    const resetFilters: DiscoverFilterOptions = {
      workoutParts: [],
      strengthLevels: [],
      minAge: undefined,
      maxAge: undefined,
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const activeFilterCount =
    localFilters.workoutParts.length +
    localFilters.strengthLevels.length +
    (localFilters.minAge ? 1 : 0) +
    (localFilters.maxAge ? 1 : 0);

  return (
    <>
      {/* Filter Button */}
      <button
        onClick={() => setShowFilters(true)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Filter className="w-6 h-6 text-gray-700" />
        {activeFilterCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-blue-600 rounded-full min-w-[18px]">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Workout Parts Filter */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Favorite Workout Parts
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Find partners who train the same muscle groups
                </p>
                <div className="flex flex-wrap gap-2">
                  {WORKOUT_PARTS.map((part) => (
                    <button
                      key={part.value}
                      onClick={() => toggleWorkoutPart(part.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        localFilters.workoutParts.includes(part.value)
                          ? 'bg-blue-600 text-white shadow-md scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="mr-2">{part.emoji}</span>
                      {part.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strength Level Filter */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Strength Level
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Match with partners at similar fitness levels
                </p>
                <div className="space-y-3">
                  {STRENGTH_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => toggleStrengthLevel(level.value)}
                      className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                        localFilters.strengthLevels.includes(level.value)
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{level.label}</p>
                          <p className={`text-sm ${
                            localFilters.strengthLevels.includes(level.value)
                              ? 'text-blue-100'
                              : 'text-gray-500'
                          }`}>
                            {level.description}
                          </p>
                        </div>
                        {localFilters.strengthLevels.includes(level.value) && (
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Range Filter */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Age Range (Optional)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Age
                    </label>
                    <input
                      type="number"
                      value={localFilters.minAge || ''}
                      onChange={(e) => setLocalFilters({
                        ...localFilters,
                        minAge: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      placeholder="18"
                      min="18"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Age
                    </label>
                    <input
                      type="number"
                      value={localFilters.maxAge || ''}
                      onChange={(e) => setLocalFilters({
                        ...localFilters,
                        maxAge: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      placeholder="65"
                      min="18"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={handleResetFilters}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleApplyFilters}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

/**
 * GymMatch - Onboarding Flow
 *
 * 5-Step user onboarding process:
 * 1. Basic Info (name, age, gender, location)
 * 2. Fitness Profile (level, goals, styles)
 * 3. Schedule (weekly workout times)
 * 4. Photos & Bio
 * 5. Preferences (partner preferences)
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { POPULAR_GYMS, FITNESS_LEVELS, FITNESS_GOALS, WORKOUT_STYLES } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

type Step = 1 | 2 | 3 | 4 | 5;

interface OnboardingData {
  // Step 0: Account Creation
  email: string;
  password: string;

  // Step 1: Basic Info
  name: string;
  age: number | null;
  gender: 'male' | 'female' | 'other' | '';
  location: string;
  gym: string;

  // Step 2: Fitness Profile
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced' | '';
  goals: string[];
  workoutStyles: string[];

  // Step 3: Schedule (simplified for MVP)
  workoutDays: string[];
  preferredTime: string;

  // Step 4: Photos & Bio
  bio: string;

  // Step 5: Preferences
  partnerGender: 'same' | 'any' | 'opposite' | '';
  ageRangeMin: number;
  ageRangeMax: number;
  maxDistance: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState<OnboardingData>({
    email: '',
    password: '',
    name: '',
    age: null,
    gender: '',
    location: '',
    gym: '',
    fitnessLevel: '',
    goals: [],
    workoutStyles: [],
    workoutDays: [],
    preferredTime: '',
    bio: '',
    partnerGender: '',
    ageRangeMin: 22,
    ageRangeMax: 35,
    maxDistance: 5,
  });

  // Check if user is logged in
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Not logged in - redirect to signup
      router.push('/signup');
      return;
    }

    // Check if profile already exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      // Profile exists - redirect to home
      router.push('/');
      return;
    }

    setCurrentUser(user);
  };

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Validate required fields
      if (!formData.name || !formData.age || !formData.gender || !formData.location || !formData.fitnessLevel) {
        setError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      if (!currentUser) {
        setError('Session expired. Please log in again.');
        router.push('/signup');
        return;
      }

      console.log('💾 Creating profile for user:', currentUser.id);

      // Step 2: Geocode location (MVP: Use dummy coordinates for common cities)
      const cityCoordinates: Record<string, { lat: number; lng: number }> = {
        'manhattan': { lat: 40.7831, lng: -73.9712 },
        'brooklyn': { lat: 40.6782, lng: -73.9442 },
        'los angeles': { lat: 34.0522, lng: -118.2437 },
        'san francisco': { lat: 37.7749, lng: -122.4194 },
        'chicago': { lat: 41.8781, lng: -87.6298 },
        'miami': { lat: 25.7617, lng: -80.1918 },
        'austin': { lat: 30.2672, lng: -97.7431 },
        'seattle': { lat: 47.6062, lng: -122.3321 },
        'boston': { lat: 42.3601, lng: -71.0589 },
        'denver': { lat: 39.7392, lng: -104.9903 },
      };

      const locationKey = formData.location.toLowerCase().trim();
      const coords = cityCoordinates[locationKey] || { lat: 40.7831, lng: -73.9712 }; // Default to NYC

      // Step 2: Convert schedule data
      const scheduleData = formData.workoutDays.map((day) => {
        const timeMap: Record<string, string> = {
          'morning': '06:00-09:00',
          'midday': '11:00-14:00',
          'evening': '17:00-20:00',
          'night': '20:00-23:00',
        };
        return {
          day,
          startTime: timeMap[formData.preferredTime]?.split('-')[0] || '09:00',
          endTime: timeMap[formData.preferredTime]?.split('-')[1] || '10:00',
        };
      });

      // Step 3: Create profile in Supabase
      console.log('💾 Inserting profile into database...');
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: currentUser.id,
          name: formData.name,
          age: formData.age,
          gender: formData.gender,
          bio: formData.bio || `Looking for a dedicated gym partner to train together ${formData.workoutDays.length || 3}x per week. Let's motivate each other and reach our fitness goals!`,
          location: `POINT(${coords.lng} ${coords.lat})`, // PostGIS format
          location_name: formData.location, // ✅ 추가
          gym: formData.gym || null,
          fitness_level: formData.fitnessLevel,
          fitness_goals: formData.goals,
          workout_styles: formData.workoutStyles,
          schedule: scheduleData,
          partner_gender: formData.partnerGender || 'any', // ✅ 필드명 수정
          age_range: [formData.ageRangeMin, formData.ageRangeMax], // ✅ 배열로 수정
          max_distance: formData.maxDistance,
          level_match: 'any', // ✅ 추가 (기본값 'any')
          is_premium: false,
          photos: [],
        });

      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      console.log('✅ Profile created successfully!');

      // Step 4: Redirect to discover page
      console.log('🔄 Redirecting to /discover...');
      router.push('/discover');
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof OnboardingData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleArrayItem = (field: 'goals' | 'workoutStyles' | 'workoutDays', item: string) => {
    const currentArray = formData[field];
    if (currentArray.includes(item)) {
      updateField(
        field,
        currentArray.filter((i) => i !== item)
      );
    } else {
      updateField(field, [...currentArray, item]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-teal-600 hover:text-teal-700 font-medium">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            Create Your Profile
          </h1>
          <p className="text-gray-600 mt-2">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Let's start with the basics
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => updateField('age', parseInt(e.target.value))}
                    placeholder="25"
                    min="18"
                    max="99"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['male', 'female', 'other'].map((gender) => (
                      <button
                        key={gender}
                        onClick={() => updateField('gender', gender)}
                        className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                          formData.gender === gender
                            ? 'border-teal-600 bg-teal-50 text-teal-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-teal-300'
                        }`}
                      >
                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location (City)
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder="Manhattan, NYC"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    We'll use this to find gym partners near you
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gym (Optional)
                  </label>
                  <select
                    value={formData.gym}
                    onChange={(e) => updateField('gym', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent text-gray-900"
                  >
                    <option value="">Select your gym</option>
                    {POPULAR_GYMS.map((gym) => (
                      <option key={gym} value={gym}>
                        {gym}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Fitness Profile */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Tell us about your fitness journey
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Fitness Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(FITNESS_LEVELS).map(([key, level]) => (
                      <button
                        key={key}
                        onClick={() => updateField('fitnessLevel', key)}
                        className={`px-4 py-4 rounded-lg border-2 transition-colors text-left ${
                          formData.fitnessLevel === key
                            ? 'border-teal-600 bg-teal-50'
                            : 'border-gray-300 bg-white hover:border-teal-300'
                        }`}
                      >
                        <div className={`font-bold text-lg mb-1 ${
                          formData.fitnessLevel === key ? 'text-teal-700' : 'text-gray-900'
                        }`}>
                          {level.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {level.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Fitness Goals (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(FITNESS_GOALS).map(([key, goal]) => (
                      <button
                        key={key}
                        onClick={() => toggleArrayItem('goals', key)}
                        className={`px-4 py-3 rounded-lg border-2 transition-colors text-left ${
                          formData.goals.includes(key)
                            ? 'border-teal-600 bg-teal-50'
                            : 'border-gray-300 bg-white hover:border-teal-300'
                        }`}
                      >
                        <span className={`font-semibold ${
                          formData.goals.includes(key) ? 'text-teal-700' : 'text-gray-900'
                        }`}>
                          {goal.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Workout Styles (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(WORKOUT_STYLES).map(([key, style]) => (
                      <button
                        key={key}
                        onClick={() => toggleArrayItem('workoutStyles', key)}
                        className={`px-4 py-3 rounded-lg border-2 transition-colors text-left ${
                          formData.workoutStyles.includes(key)
                            ? 'border-teal-600 bg-teal-50'
                            : 'border-gray-300 bg-white hover:border-teal-300'
                        }`}
                      >
                        <div className={`font-semibold mb-1 ${
                          formData.workoutStyles.includes(key) ? 'text-teal-700' : 'text-gray-900'
                        }`}>
                          {style.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {style.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Schedule (Simplified) */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                When do you usually work out?
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Workout Days
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                      (day) => (
                        <button
                          key={day}
                          onClick={() => toggleArrayItem('workoutDays', day)}
                          className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                            formData.workoutDays.includes(day)
                              ? 'border-teal-600 bg-teal-50 text-teal-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-teal-300'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Preferred Time
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Early Morning (6-9 AM)', value: 'morning' },
                      { label: 'Midday (11 AM - 2 PM)', value: 'midday' },
                      { label: 'Evening (5-8 PM)', value: 'evening' },
                      { label: 'Night (8-11 PM)', value: 'night' },
                    ].map((time) => (
                      <button
                        key={time.value}
                        onClick={() => updateField('preferredTime', time.value)}
                        className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                          formData.preferredTime === time.value
                            ? 'border-teal-600 bg-teal-50 text-teal-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-teal-300'
                        }`}
                      >
                        {time.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Bio */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Tell potential partners about yourself
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio (20-300 characters)
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => updateField('bio', e.target.value)}
                    placeholder="Looking for a consistent workout partner to hit the gym 3-4x/week. Love powerlifting and trying new protein shakes!"
                    rows={6}
                    maxLength={300}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent resize-none text-gray-900 placeholder:text-gray-400"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.bio.length}/300 characters
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Photo Upload Coming Soon!</strong> For now, we'll use a default
                    avatar. You'll be able to add photos in the next update.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Preferences */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Who are you looking to match with?
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Partner Gender Preference
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'same', label: 'Same as me' },
                      { value: 'opposite', label: 'Opposite' },
                      { value: 'any', label: 'Any gender' },
                    ].map((pref) => (
                      <button
                        key={pref.value}
                        onClick={() => updateField('partnerGender', pref.value)}
                        className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                          formData.partnerGender === pref.value
                            ? 'border-teal-600 bg-teal-50 text-teal-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-teal-300'
                        }`}
                      >
                        {pref.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Age Range: {formData.ageRangeMin} - {formData.ageRangeMax} years
                  </label>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-2">Minimum age: {formData.ageRangeMin}</div>
                      <input
                        type="range"
                        min="18"
                        max="65"
                        value={formData.ageRangeMin}
                        onChange={(e) => updateField('ageRangeMin', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-teal-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-2">Maximum age: {formData.ageRangeMax}</div>
                      <input
                        type="range"
                        min="18"
                        max="65"
                        value={formData.ageRangeMax}
                        onChange={(e) => updateField('ageRangeMax', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-teal-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Maximum Distance: {formData.maxDistance} miles
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    value={formData.maxDistance}
                    onChange={(e) => updateField('maxDistance', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-teal-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>1 mile</span>
                    <span>25 miles</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-white text-teal-600 font-semibold rounded-full border-2 border-teal-600 hover:bg-teal-50 transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-full hover:bg-teal-700 transition-colors shadow-lg"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className={`px-8 py-3 text-white font-semibold rounded-full transition-colors shadow-lg ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              {isSubmitting ? 'Creating Profile...' : 'Complete Profile'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

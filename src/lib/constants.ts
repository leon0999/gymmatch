/**
 * GymMatch - Application Constants
 *
 * Centralized configuration for the entire application
 */

import { FitnessGoal, FitnessLevel, WorkoutStyle } from './types';

// ============================================================================
// APP CONFIGURATION
// ============================================================================

export const APP_CONFIG = {
  name: 'GymMatch',
  tagline: 'Find Your Perfect Gym Partner',
  version: '1.0.0',
  supportEmail: 'support@gymmatch.app',
  websiteUrl: 'https://gymmatch.app',
} as const;

// ============================================================================
// FREE vs PREMIUM LIMITS
// ============================================================================

export const SWIPE_LIMITS = {
  FREE_DAILY_SWIPES: 3,
  PREMIUM_DAILY_SWIPES: Infinity,
  SWIPE_COOLDOWN_HOURS: 24,
} as const;

export const PREMIUM_FEATURES = {
  UNLIMITED_SWIPES: true,
  SEE_WHO_LIKED_YOU: true,
  REWIND_SWIPES: true,
  BOOST_PROFILE: true,
  ADVANCED_FILTERS: true,
  READ_RECEIPTS: true,
  PRIORITY_SUPPORT: true,
} as const;

export const PREMIUM_PRICING = {
  MONTHLY: {
    price: 9.99,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || '',
  },
  YEARLY: {
    price: 79.99,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID || '',
    savingsPercent: 33,
  },
} as const;

// ============================================================================
// MATCHING ALGORITHM WEIGHTS
// ============================================================================

export const MATCH_WEIGHTS = {
  DISTANCE: 30,      // Most important - proximity
  SCHEDULE: 25,      // Can they work out together?
  STYLE: 20,         // Similar workout preferences
  LEVEL: 15,         // Fitness level compatibility
  GOALS: 10,         // Shared fitness goals
} as const;

export const DISTANCE_SCORING = {
  EXCELLENT: { max: 1, points: 30 },   // Within 1 mile
  GOOD: { max: 3, points: 20 },        // Within 3 miles
  FAIR: { max: 5, points: 10 },        // Within 5 miles
  POOR: { max: 10, points: 5 },        // Within 10 miles
} as const;

export const MINIMUM_MATCH_SCORE = 40; // Don't show matches below 40%

// ============================================================================
// LOCATION SETTINGS
// ============================================================================

export const LOCATION_CONFIG = {
  DEFAULT_RADIUS_MILES: 5,
  MAX_RADIUS_MILES: 25,
  MIN_RADIUS_MILES: 1,
  DEFAULT_CENTER: {
    lat: 40.7128,  // NYC
    lng: -74.0060,
  },
} as const;

// ============================================================================
// FITNESS LEVEL OPTIONS
// ============================================================================

export const FITNESS_LEVELS: Record<FitnessLevel, { label: string; description: string; emoji: string }> = {
  beginner: {
    label: 'Beginner',
    description: 'Just starting my fitness journey',
    emoji: '🌱',
  },
  intermediate: {
    label: 'Intermediate',
    description: '1-3 years of consistent training',
    emoji: '💪',
  },
  advanced: {
    label: 'Advanced',
    description: '3+ years, compete or train seriously',
    emoji: '🏆',
  },
} as const;

// ============================================================================
// FITNESS GOALS
// ============================================================================

export const FITNESS_GOALS: Record<FitnessGoal, { label: string; emoji: string }> = {
  muscle: { label: 'Build Muscle', emoji: '💪' },
  weight_loss: { label: 'Lose Weight', emoji: '🔥' },
  endurance: { label: 'Endurance', emoji: '🏃' },
  strength: { label: 'Get Stronger', emoji: '🏋️' },
  flexibility: { label: 'Flexibility', emoji: '🧘' },
  general_fitness: { label: 'General Fitness', emoji: '❤️' },
} as const;

// ============================================================================
// WORKOUT STYLES
// ============================================================================

export const WORKOUT_STYLES: Record<WorkoutStyle, { label: string; emoji: string; description: string }> = {
  powerlifting: {
    label: 'Powerlifting',
    emoji: '🏋️',
    description: 'Squat, bench, deadlift focused',
  },
  bodybuilding: {
    label: 'Bodybuilding',
    emoji: '💪',
    description: 'Hypertrophy and aesthetics',
  },
  crossfit: {
    label: 'CrossFit',
    emoji: '🤸',
    description: 'High-intensity functional fitness',
  },
  cardio: {
    label: 'Cardio',
    emoji: '🏃',
    description: 'Running, cycling, rowing',
  },
  yoga: {
    label: 'Yoga',
    emoji: '🧘',
    description: 'Flexibility and mindfulness',
  },
  pilates: {
    label: 'Pilates',
    emoji: '🤸‍♀️',
    description: 'Core strength and stability',
  },
  boxing: {
    label: 'Boxing/MMA',
    emoji: '🥊',
    description: 'Combat sports training',
  },
  sports: {
    label: 'Sports',
    emoji: '⚽',
    description: 'Basketball, soccer, tennis',
  },
} as const;

// ============================================================================
// POPULAR GYMS (US)
// ============================================================================

export const POPULAR_GYMS = [
  'LA Fitness',
  'Planet Fitness',
  '24 Hour Fitness',
  'Gold\'s Gym',
  'Anytime Fitness',
  'Equinox',
  'Crunch Fitness',
  'Lifetime Fitness',
  'YMCA',
  'CrossFit Box',
  'Other',
] as const;

// ============================================================================
// AGE RANGES
// ============================================================================

export const AGE_CONFIG = {
  MIN_AGE: 18,
  MAX_AGE: 65,
  DEFAULT_RANGE: [22, 35] as [number, number],
} as const;

// ============================================================================
// SCHEDULE PRESETS
// ============================================================================

export const SCHEDULE_PRESETS = {
  MORNING: { start: '06:00', end: '09:00' },
  MIDDAY: { start: '11:00', end: '14:00' },
  EVENING: { start: '17:00', end: '20:00' },
  NIGHT: { start: '20:00', end: '23:00' },
} as const;

export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

// ============================================================================
// PROFILE VALIDATION
// ============================================================================

export const VALIDATION_RULES = {
  NAME: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
  },
  BIO: {
    minLength: 20,
    maxLength: 300,
  },
  PHOTOS: {
    minCount: 2,
    maxCount: 6,
    maxSizeMB: 5,
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  },
  AGE: {
    min: 18,
    max: 99,
  },
} as const;

// ============================================================================
// CHAT SETTINGS
// ============================================================================

export const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 500,
  TYPING_INDICATOR_TIMEOUT: 3000, // ms
  MESSAGE_FETCH_LIMIT: 50,
  REALTIME_CHANNEL_PREFIX: 'chat:',
} as const;

// ============================================================================
// NOTIFICATION SETTINGS
// ============================================================================

export const NOTIFICATION_TYPES = {
  NEW_MATCH: 'new_match',
  NEW_MESSAGE: 'new_message',
  WORKOUT_INVITE: 'workout_invite',
  WORKOUT_REMINDER: 'workout_reminder',
  PROFILE_VIEW: 'profile_view',
  SOMEONE_LIKED_YOU: 'someone_liked_you',
} as const;

// ============================================================================
// ANALYTICS EVENTS
// ============================================================================

export const ANALYTICS_EVENTS = {
  // Onboarding
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',

  // Matching
  SWIPE_RIGHT: 'swipe_right',
  SWIPE_LEFT: 'swipe_left',
  SUPER_LIKE: 'super_like',
  NEW_MATCH: 'new_match',
  MATCH_VIEWED: 'match_viewed',

  // Chat
  MESSAGE_SENT: 'message_sent',
  CHAT_OPENED: 'chat_opened',

  // Workouts
  WORKOUT_INVITED: 'workout_invited',
  WORKOUT_ACCEPTED: 'workout_accepted',
  WORKOUT_COMPLETED: 'workout_completed',

  // Premium
  PREMIUM_VIEWED: 'premium_viewed',
  PREMIUM_PURCHASED: 'premium_purchased',
  PREMIUM_CANCELLED: 'premium_cancelled',

  // Profile
  PROFILE_EDITED: 'profile_edited',
  PHOTO_UPLOADED: 'photo_uploaded',
} as const;

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const COLORS = {
  primary: '#00D9B2',      // Teal/turquoise
  secondary: '#FF6B6B',    // Coral red
  success: '#4A90E2',      // Blue
  warning: '#FFB84D',      // Orange
  danger: '#E74C3C',       // Red
  gray: '#95A5A6',         // Gray
  dark: '#2C3E50',         // Dark blue-gray
} as const;

export const BADGE_TYPES = {
  VERIFIED: { label: 'Verified', emoji: '✓', color: 'blue' },
  PREMIUM: { label: 'Premium', emoji: '⭐', color: 'gold' },
  NEW_USER: { label: 'New', emoji: '🆕', color: 'green' },
  ACTIVE_TODAY: { label: 'Active Today', emoji: '🟢', color: 'green' },
  STREAK_7: { label: '7-Day Streak', emoji: '🔥', color: 'orange' },
  STREAK_30: { label: '30-Day Streak', emoji: '🔥', color: 'red' },
  COMPLETED_10: { label: '10 Workouts', emoji: '💪', color: 'purple' },
} as const;

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ROUTES = {
  // Auth
  SIGN_UP: '/api/auth/signup',
  SIGN_IN: '/api/auth/signin',
  SIGN_OUT: '/api/auth/signout',

  // Profile
  GET_PROFILE: '/api/profile',
  UPDATE_PROFILE: '/api/profile/update',
  UPLOAD_PHOTO: '/api/profile/upload-photo',

  // Matching
  GET_MATCHES: '/api/match/discover',
  SWIPE: '/api/match/swipe',
  GET_MUTUAL_MATCHES: '/api/match/mutual',

  // Chat
  GET_CONVERSATIONS: '/api/chat/conversations',
  GET_MESSAGES: '/api/chat/messages',
  SEND_MESSAGE: '/api/chat/send',

  // Workouts
  SEND_WORKOUT_INVITE: '/api/workout/invite',
  RESPOND_TO_INVITE: '/api/workout/respond',
  GET_SCHEDULED_WORKOUTS: '/api/workout/scheduled',

  // Premium
  CREATE_CHECKOUT: '/api/premium/checkout',
  CANCEL_SUBSCRIPTION: '/api/premium/cancel',
  GET_SUBSCRIPTION: '/api/premium/subscription',
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please log in to continue.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_FAILED: 'Please check your input and try again.',
  QUOTA_EXCEEDED: 'You\'ve reached your daily swipe limit. Upgrade to Premium for unlimited swipes!',
  PAYMENT_FAILED: 'Payment failed. Please try again or use a different payment method.',
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully!',
  MATCH_FOUND: 'It\'s a match! Start chatting now.',
  MESSAGE_SENT: 'Message sent.',
  WORKOUT_INVITED: 'Workout invite sent!',
  PREMIUM_ACTIVATED: 'Welcome to Premium! Enjoy unlimited features.',
} as const;

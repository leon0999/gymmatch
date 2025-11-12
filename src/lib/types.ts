/**
 * GymMatch - Core TypeScript Interfaces
 *
 * Comprehensive type definitions for the gym partner matching platform
 */

// ============================================================================
// USER PROFILE TYPES
// ============================================================================

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TimeSlot {
  start: string; // "09:00"
  end: string;   // "10:30"
}

export interface DaySchedule {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type FitnessGoal = 'muscle' | 'weight_loss' | 'endurance' | 'strength' | 'flexibility' | 'general_fitness';
export type WorkoutStyle = 'powerlifting' | 'bodybuilding' | 'crossfit' | 'cardio' | 'yoga' | 'pilates' | 'boxing' | 'sports';
export type Gender = 'male' | 'female' | 'other';
export type PartnerGenderPreference = 'same' | 'any' | 'opposite';
export type LevelMatchPreference = 'similar' | 'higher' | 'lower' | 'any';

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: Date;
}

export interface UserBasics {
  name: string;
  age: number;
  gender: Gender;
  location: Coordinates;
  locationName: string; // "Manhattan, NYC"
  gym?: string;
  gymChain?: string; // "LA Fitness", "Planet Fitness"
}

export interface UserFitness {
  level: FitnessLevel;
  goals: FitnessGoal[];
  schedule: DaySchedule;
  styles: WorkoutStyle[];
  experience: string; // "2 years"
}

export interface UserPreferences {
  partnerGender: PartnerGenderPreference;
  ageRange: [number, number]; // [18, 35]
  maxDistance: number; // miles
  levelMatch: LevelMatchPreference;
  minMatchScore?: number; // 70 (only show matches above this score)
}

export interface UserSocial {
  instagram?: string;
  bio: string;
  photos: string[]; // URLs to profile photos
  badges: Badge[];
  verified: boolean;
}

export interface UserProfile {
  id: string;
  userId: string; // Supabase Auth user ID
  basics: UserBasics;
  fitness: UserFitness;
  preferences: UserPreferences;
  social: UserSocial;
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
}

// ============================================================================
// MATCHING TYPES
// ============================================================================

export interface MatchScore {
  total: number; // 0-100
  breakdown: {
    distance: number;      // 0-30 points
    schedule: number;      // 0-25 points
    style: number;         // 0-20 points
    level: number;         // 0-15 points
    goals: number;         // 0-10 points
  };
}

export interface Match {
  id: string;
  profile: UserProfile;
  score: MatchScore;
  distance: number; // miles
  scheduleOverlap: number; // 0-1 (percentage)
  mutualGoals: string[];
  mutualStyles: string[];
  isOnline: boolean;
  lastActiveMinutes: number; // "Online 5m ago"
}

export interface SwipeAction {
  userId: string;
  targetUserId: string;
  action: 'like' | 'pass' | 'superlike';
  timestamp: Date;
}

export interface MutualMatch {
  id: string;
  user1Id: string;
  user2Id: string;
  matchedAt: Date;
  chatStarted: boolean;
  workoutScheduled: boolean;
  lastMessageAt?: Date;
}

// ============================================================================
// CHAT TYPES
// ============================================================================

export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'workout_invite' | 'system';
  timestamp: Date;
  read: boolean;
}

export interface ChatConversation {
  matchId: string;
  match: MutualMatch;
  otherUser: UserProfile;
  messages: ChatMessage[];
  unreadCount: number;
  lastMessage?: ChatMessage;
  typing: boolean;
}

// ============================================================================
// WORKOUT SCHEDULING TYPES
// ============================================================================

export interface WorkoutInvite {
  id: string;
  matchId: string;
  senderId: string;
  receiverId: string;
  datetime: Date;
  location: string;
  workoutType: WorkoutStyle;
  duration: number; // minutes
  notes?: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  createdAt: Date;
}

export interface ScheduledWorkout {
  id: string;
  matchId: string;
  participants: string[]; // user IDs
  datetime: Date;
  location: string;
  workoutType: WorkoutStyle;
  duration: number;
  notes?: string;
  checkedIn: string[]; // user IDs who checked in
  completed: boolean;
  rating?: number; // 1-5 stars
}

// ============================================================================
// PREMIUM & MONETIZATION TYPES
// ============================================================================

export interface PremiumFeatures {
  unlimitedSwipes: boolean;
  seeWhoLikedYou: boolean;
  rewindLastSwipe: boolean;
  boostProfile: boolean; // Show to more people
  advancedFilters: boolean;
  readReceipts: boolean;
  prioritySupport: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'premium';
  status: 'active' | 'cancelled' | 'expired';
  startDate: Date;
  endDate?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  features: PremiumFeatures;
}

export interface SwipeQuota {
  userId: string;
  dailyLimit: number; // 3 for free, unlimited for premium
  swipesUsed: number;
  resetsAt: Date;
}

// ============================================================================
// ANALYTICS & STATS TYPES
// ============================================================================

export interface UserStats {
  userId: string;
  totalSwipes: number;
  likesGiven: number;
  likesReceived: number;
  matches: number;
  workoutsScheduled: number;
  workoutsCompleted: number;
  avgMatchScore: number;
  profileViews: number;
  responseRate: number; // 0-1
}

export interface AppAnalytics {
  date: Date;
  newUsers: number;
  activeUsers: number;
  totalSwipes: number;
  newMatches: number;
  messagesExchanged: number;
  workoutsScheduled: number;
  premiumConversions: number;
  revenue: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// FORM & UI STATE TYPES
// ============================================================================

export interface OnboardingStep {
  step: 1 | 2 | 3 | 4 | 5;
  title: string;
  subtitle: string;
  completed: boolean;
}

export interface OnboardingState {
  currentStep: number;
  steps: OnboardingStep[];
  formData: Partial<UserProfile>;
  errors: Record<string, string>;
}

export interface SwipeUIState {
  currentIndex: number;
  matches: Match[];
  loading: boolean;
  noMoreMatches: boolean;
  swipeCount: number;
  quotaExceeded: boolean;
}

export interface FilterState {
  distance: number;
  ageRange: [number, number];
  gender: PartnerGenderPreference;
  level: LevelMatchPreference;
  goals: FitnessGoal[];
  styles: WorkoutStyle[];
  minScore: number;
}

// ============================================================================
// SOCIAL FEED TYPES (Phase 4 - MVP)
// ============================================================================

export type MediaType = 'photo' | 'video';
export type WorkoutPart = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio';
export type StrengthLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Post {
  id: string;
  user_id: string;              // 사진 주인공
  photographer_id: string;      // 찍어준 사람
  match_id?: string;

  media_type: MediaType;
  media_url: string;
  thumbnail_url?: string;       // 영상일 경우 썸네일

  workout_type?: WorkoutPart;
  exercise_name?: string;
  caption?: string;

  likes_count: number;
  comments_count: number;
  views_count: number;

  created_at: string;

  // Relations (joined data)
  user?: {
    name: string;
    photo_url?: string;
  };
  photographer?: {
    name: string;
    photo_url?: string;
  };
}

export interface PostLike {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  comment: string;
  created_at: string;

  // Relations
  user?: {
    name: string;
    photo_url?: string;
  };
}

export type NotificationType = 'like' | 'comment' | 'new_post' | 'new_match';

export interface Notification {
  id: string;
  user_id: string;              // 받는 사람
  type: NotificationType;

  from_user_id?: string;
  post_id?: string;
  comment_id?: string;
  match_id?: string;

  is_read: boolean;
  created_at: string;

  // Relations
  from_user?: {
    name: string;
    photo_url?: string;
  };
  post?: {
    media_url: string;
    thumbnail_url?: string;
  };
  comment?: {
    comment: string;
  };
}

export interface WorkoutSession {
  id: string;
  match_id: string;
  workout_date: string;
  workout_parts: WorkoutPart[];
  duration_minutes?: number;
  media_urls?: string[];
  status: 'scheduled' | 'in_progress' | 'completed';
  created_at: string;
  completed_at?: string;
}

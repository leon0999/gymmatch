/**
 * GymMatch - Supabase Client Configuration
 *
 * Centralized Supabase client for database operations, auth, and realtime subscriptions
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ============================================================================
// AUTH HELPERS
// ============================================================================

export const auth = {
  /**
   * Sign up with email and password
   */
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  /**
   * Sign out current user
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  /**
   * Get current session
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },

  /**
   * Get current user
   */
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  },
};

// ============================================================================
// DATABASE HELPERS
// ============================================================================

export const db = {
  /**
   * Get user profile by user ID
   */
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId: string, updates: Record<string, any>) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    return { data, error };
  },

  /**
   * Get potential matches for a user
   */
  getMatches: async (userId: string, filters: Record<string, any>) => {
    // This will be replaced with the actual matching algorithm
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('user_id', userId)
      .limit(20);
    return { data, error };
  },

  /**
   * Record a swipe action
   */
  recordSwipe: async (swipe: {
    user_id: string;
    target_user_id: string;
    action: 'like' | 'pass' | 'superlike';
  }) => {
    const { data, error } = await supabase
      .from('swipes')
      .insert(swipe)
      .select()
      .single();
    return { data, error };
  },

  /**
   * Check if two users have matched
   */
  checkMutualMatch: async (userId: string, targetUserId: string) => {
    const { data, error } = await supabase
      .from('swipes')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('target_user_id', userId)
      .eq('action', 'like')
      .single();

    if (data) {
      // Create mutual match
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert({
          user1_id: userId,
          user2_id: targetUserId,
        })
        .select()
        .single();
      return { data: matchData, error: matchError };
    }

    return { data: null, error };
  },

  /**
   * Get user's mutual matches
   */
  getMutualMatches: async (userId: string) => {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        user1:profiles!matches_user1_id_fkey(*),
        user2:profiles!matches_user2_id_fkey(*)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  /**
   * Get chat messages for a match
   */
  getMessages: async (matchId: string, limit = 50) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data, error };
  },

  /**
   * Send a chat message
   */
  sendMessage: async (message: {
    match_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
  }) => {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();
    return { data, error };
  },

  /**
   * Get user's swipe quota
   */
  getSwipeQuota: async (userId: string) => {
    const { data, error } = await supabase
      .from('swipe_quotas')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  },

  /**
   * Update swipe quota
   */
  updateSwipeQuota: async (userId: string, swipesUsed: number) => {
    const { data, error } = await supabase
      .from('swipe_quotas')
      .update({ swipes_used: swipesUsed })
      .eq('user_id', userId)
      .select()
      .single();
    return { data, error };
  },

  /**
   * Get user subscription
   */
  getSubscription: async (userId: string) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  },
};

// ============================================================================
// REALTIME HELPERS
// ============================================================================

export const realtime = {
  /**
   * Subscribe to chat messages for a match
   */
  subscribeToChatMessages: (
    matchId: string,
    callback: (message: any) => void
  ) => {
    const channel = supabase
      .channel(`chat:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return channel;
  },

  /**
   * Subscribe to typing indicator
   */
  subscribeToTyping: (
    matchId: string,
    callback: (isTyping: boolean, userId: string) => void
  ) => {
    const channel = supabase
      .channel(`typing:${matchId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Handle typing indicator logic
      })
      .subscribe();

    return channel;
  },

  /**
   * Unsubscribe from a channel
   */
  unsubscribe: (channel: any) => {
    channel.unsubscribe();
  },
};

// ============================================================================
// STORAGE HELPERS
// ============================================================================

export const storage = {
  /**
   * Upload profile photo
   */
  uploadPhoto: async (userId: string, file: File) => {
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file);

    if (error) return { data: null, error };

    const { data: urlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName);

    return { data: urlData.publicUrl, error: null };
  },

  /**
   * Delete profile photo
   */
  deletePhoto: async (photoUrl: string) => {
    const fileName = photoUrl.split('/').pop();
    if (!fileName) return { error: new Error('Invalid photo URL') };

    const { error } = await supabase.storage
      .from('profile-photos')
      .remove([fileName]);

    return { error };
  },
};

export default supabase;

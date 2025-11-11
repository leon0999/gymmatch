'use client';

/**
 * GymMatch - Global Presence Tracker
 *
 * Tracks user's online status across all pages
 */

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Global channel instance (persists across hot reloads)
let globalPresenceChannel: ReturnType<typeof supabase.channel> | null = null;
let currentUserId: string | null = null;

export default function GlobalPresence() {
  useEffect(() => {
    const setupPresence = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // If already tracking this user, don't recreate
      if (globalPresenceChannel && currentUserId === user.id) {
        console.log('GlobalPresence - Already tracking user:', user.id);
        return;
      }

      // Clean up old channel if different user
      if (globalPresenceChannel && currentUserId !== user.id) {
        console.log('GlobalPresence - Switching user, removing old channel');
        await supabase.removeChannel(globalPresenceChannel);
        globalPresenceChannel = null;
      }

      currentUserId = user.id;

      // Create global presence channel with unique ID
      globalPresenceChannel = supabase.channel('global-presence', {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      // Subscribe and track presence
      globalPresenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = globalPresenceChannel!.presenceState();
          console.log('GlobalPresence - Presence synced, state:', state);
          console.log('GlobalPresence - Number of users online:', Object.keys(state).length);
        })
        .subscribe(async (status) => {
          console.log('GlobalPresence - Subscribe status:', status);
          if (status === 'SUBSCRIBED') {
            // Track user's presence
            const result = await globalPresenceChannel!.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
            console.log('GlobalPresence - User presence tracked:', user.id);
            console.log('GlobalPresence - Track result:', result);
          }
        });
    };

    setupPresence();

    // Cleanup only on unmount (not on hot reload)
    return () => {
      // Don't cleanup on development hot reload
      if (process.env.NODE_ENV === 'development') {
        console.log('GlobalPresence - Skipping cleanup (dev mode)');
        return;
      }

      // Only cleanup in production
      if (globalPresenceChannel) {
        supabase.removeChannel(globalPresenceChannel);
        globalPresenceChannel = null;
        currentUserId = null;
        console.log('GlobalPresence - Channel removed');
      }
    };
  }, []);

  // This component doesn't render anything
  return null;
}

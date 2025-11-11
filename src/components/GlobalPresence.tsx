'use client';

/**
 * GymMatch - Global Presence Tracker
 *
 * Tracks user's online status across all pages
 */

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function GlobalPresence() {
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupPresence = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Create global presence channel with unique ID
      channel = supabase.channel('global-presence', {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      // Subscribe and track presence
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel!.presenceState();
          console.log('GlobalPresence - Presence synced, state:', state);
          console.log('GlobalPresence - Number of users online:', Object.keys(state).length);
        })
        .subscribe(async (status) => {
          console.log('GlobalPresence - Subscribe status:', status);
          if (status === 'SUBSCRIBED') {
            // Track user's presence
            const result = await channel!.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
            console.log('GlobalPresence - User presence tracked:', user.id);
            console.log('GlobalPresence - Track result:', result);
          }
        });
    };

    setupPresence();

    // Cleanup
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        console.log('Presence channel removed');
      }
    };
  }, []);

  // This component doesn't render anything
  return null;
}

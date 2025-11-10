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

      // Create global presence channel
      channel = supabase.channel('global-presence');

      // Subscribe and track presence
      channel
        .on('presence', { event: 'sync' }, () => {
          console.log('Presence synced');
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Track user's presence
            await channel!.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
            console.log('User presence tracked:', user.id);
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

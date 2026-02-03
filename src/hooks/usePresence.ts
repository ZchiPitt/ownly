/**
 * Hook for managing user presence tracking
 * US-003: Add user presence tracking for smart push suppression
 *
 * Tracks which listing conversation a user is currently viewing
 * to suppress redundant push notifications.
 */

import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/types/database';

/** Interval for updating presence while active (20 seconds) */
const PRESENCE_UPDATE_INTERVAL = 20 * 1000;

export interface UsePresenceReturn {
  /** Set the active listing conversation the user is viewing */
  setActiveConversation: (listingId: string) => Promise<void>;
  /** Clear presence (user left the conversation) */
  clearPresence: () => Promise<void>;
}

export function usePresence(): UsePresenceReturn {
  const { user } = useAuth();
  const intervalRef = useRef<number | null>(null);
  const activeListingRef = useRef<string | null>(null);

  /**
   * Update presence in the database
   */
  const updatePresence = useCallback(async (listingId: string | null): Promise<void> => {
    if (!user) return;

    try {
      type PresenceInsert = Database['public']['Tables']['user_presence']['Insert'];
      const presenceData: PresenceInsert = {
        user_id: user.id,
        active_listing_id: listingId,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase
        .from('user_presence') as ReturnType<typeof supabase.from>)
        .upsert(presenceData as Record<string, unknown>, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Error updating presence:', error);
      }
    } catch (err) {
      console.error('Error updating presence:', err);
    }
  }, [user]);

  /**
   * Start periodic presence updates
   */
  const startPresenceUpdates = useCallback(() => {
    // Clear any existing interval
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
    }

    // Update presence periodically while user is active
    intervalRef.current = window.setInterval(() => {
      if (activeListingRef.current) {
        updatePresence(activeListingRef.current);
      }
    }, PRESENCE_UPDATE_INTERVAL);
  }, [updatePresence]);

  /**
   * Stop periodic presence updates
   */
  const stopPresenceUpdates = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Set the active listing conversation the user is viewing
   */
  const setActiveConversation = useCallback(async (listingId: string): Promise<void> => {
    activeListingRef.current = listingId;
    await updatePresence(listingId);
    startPresenceUpdates();
  }, [updatePresence, startPresenceUpdates]);

  /**
   * Clear presence (user left the conversation)
   */
  const clearPresence = useCallback(async (): Promise<void> => {
    activeListingRef.current = null;
    stopPresenceUpdates();
    await updatePresence(null);
  }, [updatePresence, stopPresenceUpdates]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPresenceUpdates();
    };
  }, [stopPresenceUpdates]);

  // Clean up presence when user logs out
  useEffect(() => {
    if (!user && activeListingRef.current) {
      activeListingRef.current = null;
      stopPresenceUpdates();
    }
  }, [user, stopPresenceUpdates]);

  return {
    setActiveConversation,
    clearPresence,
  };
}

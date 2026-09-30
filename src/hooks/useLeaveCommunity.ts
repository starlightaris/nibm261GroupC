import { useState, useCallback } from 'react';
import { auth } from '../../firebaseConfig';
import { removeCommunityMember } from '@services/communityMembershipService';

export interface UseLeaveCommunityResult {
  leaving: boolean;
  error: string | null;
  leave: (communityId: string) => Promise<boolean>;
}

export function useLeaveCommunity(): UseLeaveCommunityResult {
  const [leaving, setLeaving] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const leave = useCallback(async (communityId: string): Promise<boolean> => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setError('Not authenticated.');
      return false;
    }

    setLeaving(true);
    setError(null);

    try {
      await removeCommunityMember(communityId, uid);
      return true;
    } catch (err: any) {
      console.error('[useLeaveCommunity]', err);
      setError(err?.message ?? 'Failed to leave community.');
      return false;
    } finally {
      setLeaving(false);
    }
  }, []);

  return { leaving, error, leave };
}

import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from './useAuth';
import { loadTripHistory, loadTripSummary } from '../services/tripService';
import { tripRepository } from '../services/tripRepository';
import type { TripSummary, TripViewer } from '../types/trip';

function useTripRequest<T>(request: (viewer: TripViewer) => Promise<T>) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const uid = user?.uid;
  const role = user?.role;

  useFocusEffect(useCallback(() => {
    let active = true;
    setData(null);
    setError(null);
    setLoading(true);
    if (authLoading) return () => { active = false; };
    if (!uid || (role !== 'driver' && role !== 'passenger')) {
      setLoading(false);
      setError('Sign in to view your trips.');
      return () => { active = false; };
    }
    request({ uid, role })
      .then((result) => { if (active) setData(result); })
      .catch(() => { if (active) setError('Could not load your trip records. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [uid, role, authLoading, request, attempt]));

  return { data, loading, error, reload: () => setAttempt((value) => value + 1), role };
}

export function useTripHistory() {
  return useTripRequest<TripSummary[]>(useCallback((viewer) => loadTripHistory(tripRepository, viewer), []));
}

export function useTripSummary(id: string) {
  return useTripRequest<TripSummary>(useCallback((viewer) => loadTripSummary(tripRepository, id, viewer), [id]));
}

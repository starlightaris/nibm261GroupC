import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@hooks/useAuth';
import { getTripHistoryRevision, loadTripHistory, loadTripSummary } from '@services/tripService';
import { tripRepository } from '@services/tripRepository';
import type { TripSummary, TripViewer } from '../types/trip';

function useTripRequest<T>(request: (viewer: TripViewer) => Promise<T>, resourceKey: string) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const resultRef = useRef<{ key: string; attempt: number; revision: number } | null>(null);
  const uid = user?.uid;
  const role = user?.role;

  useFocusEffect(useCallback(() => {
    let active = true;
    const key = `${uid}:${role}:${resourceKey}`;
    const revision = getTripHistoryRevision();
    const existing = resultRef.current?.key === key ? resultRef.current : null;
    setError(null);

    if (authLoading) {
      setLoading(true);
      return () => { active = false; };
    }
    if (!uid || (role !== 'driver' && role !== 'passenger')) {
      resultRef.current = null;
      setData(null);
      setLoading(false);
      setRefreshing(false);
      setError('Sign in to view your trips.');
      return () => { active = false; };
    }

    // Returning from a summary uses the cached list. Refreshes and locally
    // completed trips fetch fresh records while leaving that list mounted.
    if (existing && existing.attempt === attempt && existing.revision === revision) {
      setLoading(false);
      return () => { active = false; };
    }
    if (!existing) setData(null);
    setLoading(!existing);
    setRefreshing(Boolean(existing));

    request({ uid, role })
      .then((result) => {
        if (!active) return;
        resultRef.current = { key, attempt, revision };
        setData(result);
      })
      .catch((err: unknown) => {
        console.error('[useTripHistory]', err);
        if (active) setError('Could not load your trip records. Please try again.');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => { active = false; };
  }, [uid, role, authLoading, request, attempt, resourceKey]));

  return {
    data,
    loading,
    refreshing,
    error,
    reload: () => setAttempt((value) => value + 1),
    role,
  };
}

export function useTripHistory() {
  return useTripRequest<TripSummary[]>(useCallback((viewer) => loadTripHistory(tripRepository, viewer), []), 'history');
}

export function useTripSummary(id: string) {
  return useTripRequest<TripSummary>(useCallback((viewer) => loadTripSummary(tripRepository, id, viewer), [id]), id);
}

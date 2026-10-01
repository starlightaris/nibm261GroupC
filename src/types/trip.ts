import type { TripStop } from '../utils/tripStops';

export type TripStatus = 'pending' | 'active' | 'completed';
export type TripShift = 'morning' | 'evening';
export type TripViewer = { uid: string; role: 'driver' | 'passenger' };

export interface CompletedStopLogEntry {
  stopId: string;
  completedAt: string;
  location: { latitude: number; longitude: number };
  droppedOff: { userId: string; name: string }[];
  pickedUp: { userId: string; name: string }[];
}

export interface TripDocument {
  driverId: string;
  communityId: string;
  date: string;
  shift: TripShift;
  status: TripStatus;
  startedAt: unknown;
  endedAt: unknown;
  completedStops?: CompletedStopLogEntry[];
  plannedStops?: TripStop[];
  /** Community membership at departure, including absent passengers. */
  participantIds?: string[];
  totalStopsPlanned?: number;
  passengersPlanned?: number;
  summary?: TripTotals;
}

export interface TripTotals {
  totalStopsPlanned: number | null;
  stopsCompleted: number;
  passengersPlanned: number | null;
  passengersCollected: number;
  passengersMissed: number | null;
  durationSeconds: number | null;
}

export interface TripSummary extends TripTotals {
  id: string;
  date: string;
  shift: TripShift;
  startedAt: string | null;
  endedAt: string | null;
}

export type StoredTrip = { id: string; data: TripDocument };

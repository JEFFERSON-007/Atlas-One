/**
 * Temporal State Types — Centralized models for the Earth Time Machine.
 */

export enum TemporalMode {
  REAL_TIME = 'real_time',
  HISTORICAL = 'historical',
  SIMULATION = 'simulation',
}

export enum DataState {
  LIVE = 'live',
  HISTORICAL = 'historical',
  FORECAST = 'forecast',
  SIMULATED = 'simulated',
  PROPAGATED = 'propagated',
  UNKNOWN = 'unknown',
}

export type PlaybackSpeed = 0.25 | 0.5 | 1 | 2 | 5 | 10 | 50 | 60 | 100 | 1000 | 3600 | 86400;

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface TemporalState {
  mode: TemporalMode;
  currentTime: Date;
  startTime: Date;
  endTime: Date;
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  loop: boolean;
  selectedRange?: TimeRange;
}

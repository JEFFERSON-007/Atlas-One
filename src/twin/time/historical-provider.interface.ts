/**
 * Historical Data Provider Interface — Defines the contract for providing
 * temporal and historical data to the timeline and engines.
 */

import { TimeRange, DataState } from './temporal-state.types';
import { EarthEvent } from '../../events/earth-event.types';

export interface DataAvailability {
  dataset: string;
  availableRanges: TimeRange[];
  resolutionMinutes: number;
}

export interface HistoricalQuery {
  dataset: string;
  timeRange: TimeRange;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  filters?: Record<string, unknown>;
}

export interface HistoricalDataResponse {
  state: DataState;
  retrievedAt: Date;
  events: EarthEvent[]; // We standardize on EarthEvents for this implementation
}

export interface HistoricalDataProvider {
  /** Uniquely identifies the provider (e.g. 'usgs', 'mock') */
  readonly id: string;

  /** Returns availability of historical datasets for the UI */
  getAvailability(): Promise<DataAvailability[]>;

  /** Fetch historical data for a given range and bounds */
  getData(query: HistoricalQuery): Promise<HistoricalDataResponse>;

  /** Get the nearest available timestamp to a given time */
  getNearestTimestamp(dataset: string, time: Date): Promise<Date | null>;
}

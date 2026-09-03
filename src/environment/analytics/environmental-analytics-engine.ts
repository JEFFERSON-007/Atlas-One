/**
 * Environmental Analytics Engine — Time-series statistics for Atlas One v0.8.
 * Supports min/max/median/moving-average, percent change, anomaly delta.
 */

import type { EnvironmentalObservation } from '../types/environmental.types';

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
}

export interface AnalyticsResult {
  variable: string;
  location: string;
  points: TimeSeriesPoint[];
  min: number;
  max: number;
  mean: number;
  median: number;
  stddev: number;
  count: number;
  percentChange: number | null; // null if insufficient data
}

export class EnvironmentalAnalyticsEngine {

  /** Computes summary statistics from a list of observations. */
  computeStatistics(
    observations: EnvironmentalObservation[],
    locationLabel?: string,
  ): AnalyticsResult {
    if (observations.length === 0) {
      return this.emptyResult(locationLabel);
    }

    const values = observations.map(o => o.value).sort((a, b) => a - b);
    const points = observations
      .map(o => ({ timestamp: o.timestamp, value: o.value }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    
    const mid1 = values[values.length / 2 - 1] ?? 0;
    const mid2 = values[values.length / 2] ?? 0;
    const midOdd = values[Math.floor(values.length / 2)] ?? 0;
    const median = values.length % 2 === 0 ? (mid1 + mid2) / 2 : midOdd;

    const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
    const stddev = Math.sqrt(variance);

    // Percent change: (last - first) / |first| * 100
    // Safe division: returns null if first value is 0
    let percentChange: number | null = null;
    if (points.length >= 2) {
      const first = points[0]?.value ?? 0;
      const last = points[points.length - 1]?.value ?? 0;
      if (first !== 0) {
        percentChange = Math.round(((last - first) / Math.abs(first)) * 10000) / 100;
      }
    }

    return {
      variable: observations[0]!.variable,
      location: locationLabel ?? `${observations[0]?.latitude.toFixed(2)}, ${observations[0]?.longitude.toFixed(2)}`,
      points,
      min: values[0] ?? 0,
      max: values[values.length - 1] ?? 0,
      mean: Math.round(mean * 100) / 100,
      median: Math.round(median * 100) / 100,
      stddev: Math.round(stddev * 100) / 100,
      count: values.length,
      percentChange,
    };
  }

  /** Computes a simple moving average over the time series. */
  movingAverage(points: TimeSeriesPoint[], windowSize: number): TimeSeriesPoint[] {
    if (windowSize <= 0 || points.length < windowSize) return points;

    const result: TimeSeriesPoint[] = [];
    for (let i = windowSize - 1; i < points.length; i++) {
      let sum = 0;
      for (let j = i - windowSize + 1; j <= i; j++) {
        sum += points[j]?.value ?? 0;
      }
      const ts = points[i]?.timestamp ?? new Date();
      result.push({
        timestamp: ts,
        value: Math.round((sum / windowSize) * 100) / 100,
      });
    }

    return result;
  }

  /** Computes anomaly from a baseline mean. */
  computeAnomalies(
    observations: EnvironmentalObservation[],
    baselineMean: number,
  ): TimeSeriesPoint[] {
    return observations.map(o => ({
      timestamp: o.timestamp,
      value: Math.round((o.value - baselineMean) * 100) / 100,
    }));
  }

  private emptyResult(label?: string): AnalyticsResult {
    return {
      variable: '',
      location: label ?? 'Unknown',
      points: [],
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      stddev: 0,
      count: 0,
      percentChange: null,
    };
  }
}

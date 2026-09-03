/**
 * Correlation Engine — Associates co-located environmental datasets.
 * Labels output as "Associated environmental conditions" — NEVER "caused by".
 * Does not claim causation from correlation.
 */

import type { EnvironmentalObservation } from '../types/environmental.types';

export interface CorrelatedCondition {
  variable: string;
  value: number;
  unit: string;
  dataState: string;
  timestamp: Date;
  distance_km: number;
}

export interface CorrelationResult {
  /** Descriptive label — never claims causation. */
  label: string;
  /** The primary observation. */
  primary: {
    variable: string;
    value: number;
    unit: string;
    latitude: number;
    longitude: number;
  };
  /** Associated environmental conditions within the search radius. */
  associatedConditions: CorrelatedCondition[];
  /** Disclaimer text. */
  disclaimer: string;
}

/**
 * Finds environmental observations co-located within a radius and time window.
 * Returns them as "associated conditions" — never implies causation.
 */
export function findCorrelatedConditions(
  primaryObs: EnvironmentalObservation,
  allObservations: EnvironmentalObservation[],
  radiusKm = 100,
  timeWindowMs = 6 * 60 * 60 * 1000, // 6 hours
): CorrelationResult {
  const associated: CorrelatedCondition[] = [];

  for (const obs of allObservations) {
    // Skip same variable
    if (obs.variable === primaryObs.variable) continue;
    // Skip same observation
    if (obs.id === primaryObs.id) continue;

    // Distance check (approximate using Haversine)
    const distKm = haversineKm(
      primaryObs.latitude, primaryObs.longitude,
      obs.latitude, obs.longitude,
    );

    if (distKm > radiusKm) continue;

    // Time window check
    const timeDiff = Math.abs(obs.timestamp.getTime() - primaryObs.timestamp.getTime());
    if (timeDiff > timeWindowMs) continue;

    associated.push({
      variable: obs.variable,
      value: obs.value,
      unit: obs.unit,
      dataState: obs.dataState,
      timestamp: obs.timestamp,
      distance_km: Math.round(distKm * 10) / 10,
    });
  }

  // Sort by distance
  associated.sort((a, b) => a.distance_km - b.distance_km);

  return {
    label: 'Associated environmental conditions',
    primary: {
      variable: primaryObs.variable,
      value: primaryObs.value,
      unit: primaryObs.unit,
      latitude: primaryObs.latitude,
      longitude: primaryObs.longitude,
    },
    associatedConditions: associated,
    disclaimer:
      'These conditions are co-located in space and time. ' +
      'Spatial and temporal proximity does not imply causation.',
  };
}

/** Haversine distance in km between two lat/lon points. */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

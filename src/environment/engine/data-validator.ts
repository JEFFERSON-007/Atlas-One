/**
 * Data Validator — Validates raw environmental provider responses.
 * Rejects malformed data safely. Never lets invalid data through to rendering.
 */

import { createLogger } from '../../utils/logger';
import type { EnvironmentalObservation } from '../types/environmental.types';

const log = createLogger('DataValidator');

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a single EnvironmentalObservation.
 * Checks coordinates, units, numeric ranges, timestamp, and required fields.
 */
export function validateObservation(obs: Partial<EnvironmentalObservation>): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!obs.id) errors.push('Missing id');
  if (!obs.dataset) errors.push('Missing dataset');
  if (obs.variable === undefined) errors.push('Missing variable');
  if (obs.dataState === undefined) errors.push('Missing dataState');
  if (!obs.unit) errors.push('Missing unit');
  if (!obs.source) errors.push('Missing source');

  // Coordinate validation
  if (obs.latitude === undefined || obs.latitude === null) {
    errors.push('Missing latitude');
  } else if (obs.latitude < -90 || obs.latitude > 90) {
    errors.push(`Invalid latitude: ${obs.latitude}`);
  }

  if (obs.longitude === undefined || obs.longitude === null) {
    errors.push('Missing longitude');
  } else if (obs.longitude < -180 || obs.longitude > 180) {
    errors.push(`Invalid longitude: ${obs.longitude}`);
  }

  // Value validation
  if (obs.value === undefined || obs.value === null) {
    errors.push('Missing value');
  } else if (!Number.isFinite(obs.value)) {
    errors.push(`Non-finite value: ${obs.value}`);
  }

  // Timestamp validation
  if (!obs.timestamp) {
    errors.push('Missing timestamp');
  } else if (!(obs.timestamp instanceof Date) || isNaN(obs.timestamp.getTime())) {
    errors.push('Invalid timestamp');
  }

  // Confidence range
  if (obs.confidence !== undefined) {
    if (obs.confidence < 0 || obs.confidence > 1) {
      errors.push(`Confidence out of range [0,1]: ${obs.confidence}`);
    }
  }

  // Resolution must be positive if set
  if (obs.resolution !== undefined && obs.resolution !== null) {
    if (obs.resolution <= 0) {
      errors.push(`Invalid resolution: ${obs.resolution}`);
    }
  }

  if (errors.length > 0) {
    log.warn(`Validation failed for observation ${obs.id ?? 'unknown'}: ${errors.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Filters an array of observations, keeping only valid ones.
 * Logs rejected observations.
 */
export function filterValidObservations(
  observations: Partial<EnvironmentalObservation>[],
): EnvironmentalObservation[] {
  const valid: EnvironmentalObservation[] = [];
  let rejected = 0;

  for (const obs of observations) {
    const result = validateObservation(obs);
    if (result.valid) {
      valid.push(obs as EnvironmentalObservation);
    } else {
      rejected++;
    }
  }

  if (rejected > 0) {
    log.info(`Filtered observations: ${valid.length} valid, ${rejected} rejected`);
  }

  return valid;
}

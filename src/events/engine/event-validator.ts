/**
 * EventValidator — Input validation and sanitization for all incoming event data.
 * Ensures every event entering the store has valid coordinates, required fields,
 * and sanitized strings.
 */

import {
  type EarthEvent,
  EventSeverity,
  EventPriority,
  EventStatus,
  EventType,
} from '../earth-event.types';
import { createLogger } from '../../utils/logger';

const log = createLogger('EventValidator');

/** Validation result with errors for diagnostics. */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a single EarthEvent for correctness.
 *
 * @param event - Event to validate
 * @returns Validation result with error details
 */
export function validateEvent(event: Partial<EarthEvent>): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!event.id || typeof event.id !== 'string' || event.id.trim().length === 0) {
    errors.push('Missing or empty event ID');
  }

  if (!event.type || !Object.values(EventType).includes(event.type)) {
    errors.push(`Invalid event type: ${String(event.type)}`);
  }

  if (!event.title || typeof event.title !== 'string' || event.title.trim().length === 0) {
    errors.push('Missing or empty title');
  }

  // Coordinate validation
  if (typeof event.latitude !== 'number' || isNaN(event.latitude)) {
    errors.push('Invalid latitude: must be a number');
  } else if (event.latitude < -90 || event.latitude > 90) {
    errors.push(`Latitude out of range: ${event.latitude} (must be -90 to 90)`);
  }

  if (typeof event.longitude !== 'number' || isNaN(event.longitude)) {
    errors.push('Invalid longitude: must be a number');
  } else if (event.longitude < -180 || event.longitude > 180) {
    errors.push(`Longitude out of range: ${event.longitude} (must be -180 to 180)`);
  }

  // Timestamp validation
  if (!(event.timestamp instanceof Date) || isNaN(event.timestamp.getTime())) {
    errors.push('Invalid or missing timestamp');
  }

  // Severity validation
  if (event.severity && !Object.values(EventSeverity).includes(event.severity)) {
    errors.push(`Invalid severity: ${String(event.severity)}`);
  }

  // Priority validation
  if (event.priority && !Object.values(EventPriority).includes(event.priority)) {
    errors.push(`Invalid priority: ${String(event.priority)}`);
  }

  // Status validation
  if (event.status && !Object.values(EventStatus).includes(event.status)) {
    errors.push(`Invalid status: ${String(event.status)}`);
  }

  // Confidence validation
  if (event.confidence !== undefined) {
    if (typeof event.confidence !== 'number' || event.confidence < 0 || event.confidence > 1) {
      errors.push(`Confidence out of range: ${String(event.confidence)} (must be 0–1)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes a string to prevent XSS injection.
 *
 * @param input - Raw string from API
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates and filters an array of events, logging warnings for invalid ones.
 *
 * @param events - Raw events from a provider
 * @param providerName - Name for logging
 * @returns Only valid events
 */
export function validateEvents(events: EarthEvent[], providerName: string): EarthEvent[] {
  const valid: EarthEvent[] = [];
  let invalidCount = 0;

  for (const event of events) {
    const result = validateEvent(event);
    if (result.valid) {
      // Sanitize string fields
      valid.push({
        ...event,
        title: sanitizeString(event.title),
        description: sanitizeString(event.description),
      });
    } else {
      invalidCount++;
      if (invalidCount <= 5) {
        log.warn(`Invalid event from ${providerName}: ${result.errors.join(', ')}`);
      }
    }
  }

  if (invalidCount > 5) {
    log.warn(`${providerName}: ${invalidCount} total invalid events suppressed`);
  }

  return valid;
}

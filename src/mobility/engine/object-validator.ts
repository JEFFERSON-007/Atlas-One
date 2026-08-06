/**
 * ObjectValidator — Validates and sanitizes incoming dynamic objects.
 * Ensures data integrity before objects enter the store.
 */

import {
  type DynamicObject,
  ObjectType,
  ObjectStatus,
} from '../dynamic-object.types';
import { createLogger } from '../../utils/logger';

const log = createLogger('ObjectValidator');

/**
 * Validates a batch of dynamic objects.
 * Returns only the objects that pass validation.
 *
 * @param objects - Raw objects to validate
 * @param providerId - Provider that supplied the objects (for logging)
 */
export function validateObjects(
  objects: DynamicObject[],
  providerId: string,
): DynamicObject[] {
  const valid: DynamicObject[] = [];

  for (const obj of objects) {
    if (isValidObject(obj)) {
      valid.push(sanitizeObject(obj));
    }
  }

  const rejected = objects.length - valid.length;
  if (rejected > 0) {
    log.warn(`${providerId}: rejected ${rejected}/${objects.length} invalid objects`);
  }

  return valid;
}

/**
 * Checks whether a dynamic object has all required fields with valid values.
 */
function isValidObject(obj: DynamicObject): boolean {
  // Required string fields
  if (!obj.id || typeof obj.id !== 'string') return false;
  if (!obj.providerName || typeof obj.providerName !== 'string') return false;

  // Valid type
  if (!Object.values(ObjectType).includes(obj.type)) return false;

  // Valid status
  if (!Object.values(ObjectStatus).includes(obj.status)) return false;

  // Valid coordinates
  if (typeof obj.latitude !== 'number' || obj.latitude < -90 || obj.latitude > 90) return false;
  if (typeof obj.longitude !== 'number' || obj.longitude < -180 || obj.longitude > 180) return false;

  // Altitude check (allow negative for submarines, but not NaN)
  if (typeof obj.altitude !== 'number' || Number.isNaN(obj.altitude)) return false;

  // Heading (0–360)
  if (typeof obj.heading !== 'number' || Number.isNaN(obj.heading)) return false;

  // Speed (non-negative)
  if (typeof obj.speed !== 'number' || obj.speed < 0 || Number.isNaN(obj.speed)) return false;

  // Timestamp
  if (!(obj.timestamp instanceof Date) || Number.isNaN(obj.timestamp.getTime())) return false;

  return true;
}

/**
 * Sanitizes object fields to prevent XSS and normalize values.
 */
function sanitizeObject(obj: DynamicObject): DynamicObject {
  return {
    ...obj,
    label: sanitizeText(obj.label),
    country: sanitizeText(obj.country),
    heading: ((obj.heading % 360) + 360) % 360, // Normalize to 0–360
    longitude: normalizeLongitude(obj.longitude),
  };
}

/**
 * Strips potentially dangerous characters from text.
 */
function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .trim()
    .slice(0, 200);
}

/**
 * Normalizes longitude to -180..180 range.
 */
function normalizeLongitude(lng: number): number {
  while (lng > 180) lng -= 360;
  while (lng < -180) lng += 360;
  return lng;
}

/**
 * EntityValidator — Validates and sanitizes incoming Geospatial Entities.
 * Enforces schema compliance, coordinate bounds, and security sanitization.
 */

import {
  type GeospatialEntity,
  EntityType,
  EntityStatus,
} from './geospatial-entity.types';
import { createLogger } from '../../utils/logger';

const log = createLogger('EntityValidator');

/**
 * Validates a batch of geospatial entities.
 * Returns only valid, sanitized entities.
 */
export function validateEntities(
  entities: GeospatialEntity[],
  providerId: string,
): GeospatialEntity[] {
  const valid: GeospatialEntity[] = [];

  for (const entity of entities) {
    if (isValidEntity(entity)) {
      valid.push(sanitizeEntity(entity));
    }
  }

  const rejected = entities.length - valid.length;
  if (rejected > 0) {
    log.warn(`${providerId}: rejected ${rejected}/${entities.length} invalid entities`);
  }

  return valid;
}

/** Checks whether an entity has required fields and valid coordinate bounds. */
function isValidEntity(entity: GeospatialEntity): boolean {
  if (!entity.id || typeof entity.id !== 'string') return false;
  if (!entity.name || typeof entity.name !== 'string') return false;
  if (!Object.values(EntityType).includes(entity.type)) return false;
  if (!Object.values(EntityStatus).includes(entity.status)) return false;

  // Latitude bounds [-90, 90]
  if (typeof entity.latitude !== 'number' || entity.latitude < -90 || entity.latitude > 90) return false;

  // Longitude bounds [-180, 180]
  if (typeof entity.longitude !== 'number' || entity.longitude < -180 || entity.longitude > 180) return false;

  // Altitude check
  if (typeof entity.altitude !== 'number' || Number.isNaN(entity.altitude)) return false;

  // Timestamp check
  if (!(entity.timestamp instanceof Date) || Number.isNaN(entity.timestamp.getTime())) return false;

  return true;
}

/** Sanitizes entity text fields against XSS attacks. */
function sanitizeEntity(entity: GeospatialEntity): GeospatialEntity {
  return {
    ...entity,
    name: sanitizeText(entity.name),
    country: sanitizeText(entity.country),
    region: sanitizeText(entity.region),
    source: sanitizeText(entity.source),
    longitude: normalizeLongitude(entity.longitude),
  };
}

/** Strips HTML/Script tags and limits text length. */
function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .trim()
    .slice(0, 250);
}

/** Normalizes longitude to [-180, 180] range. */
function normalizeLongitude(lng: number): number {
  while (lng > 180) lng -= 360;
  while (lng < -180) lng += 360;
  return lng;
}

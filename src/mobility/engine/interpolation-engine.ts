/**
 * InterpolationEngine — Smooth position interpolation between data updates.
 * Uses great-circle interpolation for surface objects and linear interpolation for orbital objects.
 * Runs on requestAnimationFrame for fluid motion.
 */

import type { DynamicObject } from '../dynamic-object.types';
import { ObjectType } from '../dynamic-object.types';
import { createLogger } from '../../utils/logger';

const log = createLogger('InterpolationEngine');

/** Degrees to radians. */
const DEG2RAD = Math.PI / 180;
/** Radians to degrees. */
const RAD2DEG = 180 / Math.PI;

/**
 * Interpolates a DynamicObject's position forward in time
 * based on its current heading and speed.
 *
 * @param obj - The object to interpolate
 * @param deltaMs - Time delta in milliseconds since last known position
 * @returns Interpolated lat/lng/alt/heading
 */
export function interpolatePosition(
  obj: DynamicObject,
  deltaMs: number,
): { latitude: number; longitude: number; altitude: number; heading: number } {
  if (obj.speed === 0 || deltaMs <= 0) {
    return {
      latitude: obj.latitude,
      longitude: obj.longitude,
      altitude: obj.altitude,
      heading: obj.heading,
    };
  }

  const isOrbital =
    obj.type === ObjectType.Satellite ||
    obj.type === ObjectType.ISS ||
    obj.type === ObjectType.Starlink ||
    obj.type === ObjectType.GPS ||
    obj.type === ObjectType.GLONASS ||
    obj.type === ObjectType.Galileo ||
    obj.type === ObjectType.BeiDou;

  if (isOrbital) {
    // For orbital objects, rely on TLE propagation — no dead-reckoning interpolation
    return {
      latitude: obj.latitude,
      longitude: obj.longitude,
      altitude: obj.altitude,
      heading: obj.heading,
    };
  }

  // Great-circle dead-reckoning for surface/air objects
  return greatCircleInterpolation(obj, deltaMs);
}

/**
 * Great-circle forward projection using the Haversine formula.
 * Projects a point forward along a bearing by a given distance.
 */
function greatCircleInterpolation(
  obj: DynamicObject,
  deltaMs: number,
): { latitude: number; longitude: number; altitude: number; heading: number } {
  const deltaSec = deltaMs / 1000;
  const distanceM = obj.speed * deltaSec;

  // Earth radius in meters
  const R = 6_371_000;

  const lat1 = obj.latitude * DEG2RAD;
  const lng1 = obj.longitude * DEG2RAD;
  const bearing = obj.heading * DEG2RAD;
  const angDist = distanceM / R;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angDist) +
    Math.cos(lat1) * Math.sin(angDist) * Math.cos(bearing),
  );

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angDist) * Math.cos(lat1),
      Math.cos(angDist) - Math.sin(lat1) * Math.sin(lat2),
    );

  return {
    latitude: lat2 * RAD2DEG,
    longitude: ((lng2 * RAD2DEG + 540) % 360) - 180, // Normalize to -180..180
    altitude: obj.altitude,
    heading: obj.heading,
  };
}

/**
 * Lerps between two heading values, handling the 0/360 wraparound.
 */
export function lerpHeading(from: number, to: number, t: number): number {
  let diff = to - from;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return ((from + diff * t) % 360 + 360) % 360;
}

void log; // Suppress unused variable warning — used for future debug logging

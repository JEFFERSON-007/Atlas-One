/**
 * MobilityFilterEngine — Universal filter engine for dynamic objects.
 * Supports filtering by type, status, country, altitude, speed, heading, and text search.
 */

import type { DynamicObject, ObjectFilter } from '../dynamic-object.types';

/**
 * Filters dynamic objects against the provided criteria.
 * All criteria are AND-combined.
 *
 * @param objects - Objects to filter
 * @param filter - Filter criteria
 * @returns Filtered objects
 */
export function filterObjects(
  objects: DynamicObject[],
  filter: ObjectFilter,
): DynamicObject[] {
  return objects.filter((obj) => matchesFilter(obj, filter));
}

/**
 * Tests whether a single object matches the filter criteria.
 */
function matchesFilter(obj: DynamicObject, f: ObjectFilter): boolean {
  if (f.types && f.types.length > 0 && !f.types.includes(obj.type)) return false;

  if (f.statuses && f.statuses.length > 0 && !f.statuses.includes(obj.status)) return false;

  if (f.providers && f.providers.length > 0 && !f.providers.includes(obj.providerName)) return false;

  if (f.country && obj.country.toLowerCase() !== f.country.toLowerCase()) return false;

  if (f.altitudeRange) {
    if (obj.altitude < f.altitudeRange.min || obj.altitude > f.altitudeRange.max) return false;
  }

  if (f.speedRange) {
    if (obj.speed < f.speedRange.min || obj.speed > f.speedRange.max) return false;
  }

  if (f.headingRange) {
    if (obj.heading < f.headingRange.min || obj.heading > f.headingRange.max) return false;
  }

  if (f.operator) {
    const op = (obj.metadata['operator'] as string) || '';
    if (!op.toLowerCase().includes(f.operator.toLowerCase())) return false;
  }

  if (f.airline) {
    const al = (obj.metadata['airline'] as string) || '';
    if (!al.toLowerCase().includes(f.airline.toLowerCase())) return false;
  }

  if (f.searchText) {
    const text = f.searchText.toLowerCase();
    const searchable = `${obj.id} ${obj.label} ${obj.country}`.toLowerCase();
    if (!searchable.includes(text)) return false;
  }

  return true;
}

/**
 * Stateful filter engine that can be updated and re-applied.
 */
export class MobilityFilterEngine {
  private currentFilter: ObjectFilter = {};

  /**
   * Updates the filter criteria.
   */
  setFilter(filter: ObjectFilter): void {
    this.currentFilter = { ...filter };
  }

  /**
   * Returns the current filter.
   */
  getFilter(): ObjectFilter {
    return { ...this.currentFilter };
  }

  /**
   * Applies the current filter to a set of objects.
   */
  apply(objects: DynamicObject[]): DynamicObject[] {
    return filterObjects(objects, this.currentFilter);
  }

  /**
   * Clears all filter criteria.
   */
  clear(): void {
    this.currentFilter = {};
  }
}

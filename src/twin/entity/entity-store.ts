/**
 * EntityStore — In-memory store for all Geospatial Entities.
 * Maintains primary ID lookup, secondary type & country indexes,
 * spatial grid indexing, and store change notifications.
 */

import {
  type GeospatialEntity,
  EntityType,
} from './geospatial-entity.types';
import { SpatialIndex } from '../spatial/spatial-index';
import { eventBus } from '../../hooks/use-event-bus';
import { createLogger } from '../../utils/logger';

const log = createLogger('EntityStore');

/** Maximum total entities in memory to prevent browser bloat. */
const MAX_TOTAL_ENTITIES = 50_000;

export class EntityStore {
  /** Primary index: ID → GeospatialEntity */
  private readonly entities = new Map<string, GeospatialEntity>();

  /** Secondary index: EntityType → Set<ID> */
  private readonly typeIndex = new Map<EntityType, Set<string>>();

  /** Country index: CountryCode/Name → Set<ID> */
  private readonly countryIndex = new Map<string, Set<string>>();

  /** Spatial Index for radius and bounding box spatial queries. */
  readonly spatialIndex = new SpatialIndex();

  constructor() {
    for (const type of Object.values(EntityType)) {
      this.typeIndex.set(type, new Set());
    }
  }

  /**
   * Adds or updates entities in the store.
   * Updates indexes and spatial index automatically.
   */
  upsert(newEntities: GeospatialEntity[]): void {
    let added = 0;
    let updated = 0;

    for (const entity of newEntities) {
      const existing = this.entities.get(entity.id);

      if (existing) {
        this.entities.set(entity.id, entity);
        this.spatialIndex.update(entity);
        updated++;
      } else {
        this.entities.set(entity.id, entity);
        this.spatialIndex.insert(entity);

        // Add to type index
        let typeSet = this.typeIndex.get(entity.type);
        if (!typeSet) {
          typeSet = new Set();
          this.typeIndex.set(entity.type, typeSet);
        }
        typeSet.add(entity.id);

        // Add to country index
        if (entity.country) {
          const key = entity.country.toLowerCase();
          let countrySet = this.countryIndex.get(key);
          if (!countrySet) {
            countrySet = new Set();
            this.countryIndex.set(key, countrySet);
          }
          countrySet.add(entity.id);
        }

        added++;
      }
    }

    this.enforceCapacityLimit();

    if (added > 0 || updated > 0) {
      eventBus.emit('entities:updated', {
        totalCount: this.entities.size,
        addedCount: added,
        updatedCount: updated,
      });
    }
  }

  /** Returns entity by ID. */
  get(id: string): GeospatialEntity | undefined {
    return this.entities.get(id);
  }

  /** Returns all stored entities. */
  getAll(): GeospatialEntity[] {
    return Array.from(this.entities.values());
  }

  /** Returns entities of a specific EntityType. */
  getByType(type: EntityType): GeospatialEntity[] {
    const ids = this.typeIndex.get(type);
    if (!ids) return [];
    const result: GeospatialEntity[] = [];
    for (const id of ids) {
      const item = this.entities.get(id);
      if (item) result.push(item);
    }
    return result;
  }

  /** Returns entities belonging to a specific country. */
  getByCountry(country: string): GeospatialEntity[] {
    const ids = this.countryIndex.get(country.toLowerCase());
    if (!ids) return [];
    const result: GeospatialEntity[] = [];
    for (const id of ids) {
      const item = this.entities.get(id);
      if (item) result.push(item);
    }
    return result;
  }

  /** Returns count of entities grouped by EntityType. */
  getCountsByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [type, ids] of this.typeIndex) {
      counts[type] = ids.size;
    }
    return counts;
  }

  /** Total entity count. */
  get size(): number {
    return this.entities.size;
  }

  /** Removes entity by ID. */
  remove(id: string): void {
    const item = this.entities.get(id);
    if (!item) return;

    this.entities.delete(id);
    this.spatialIndex.remove(item);

    const typeSet = this.typeIndex.get(item.type);
    if (typeSet) typeSet.delete(id);

    if (item.country) {
      const countrySet = this.countryIndex.get(item.country.toLowerCase());
      if (countrySet) countrySet.delete(id);
    }
  }

  /** Clears all stored entities. */
  clear(): void {
    this.entities.clear();
    for (const set of this.typeIndex.values()) set.clear();
    this.countryIndex.clear();
    this.spatialIndex.clear();
  }

  /**
   * Enforces total memory capacity limits by removing lowest priority entities.
   */
  private enforceCapacityLimit(): void {
    if (this.entities.size <= MAX_TOTAL_ENTITIES) return;

    const items = Array.from(this.entities.values()).sort(
      (a, b) => a.priority - b.priority,
    );

    const toRemove = items.slice(0, items.length - MAX_TOTAL_ENTITIES);
    for (const item of toRemove) {
      this.remove(item.id);
    }

    log.info(`Capacity limit reached: pruned ${toRemove.length} low-priority entities`);
  }

  /** Disposes store resources. */
  dispose(): void {
    this.clear();
    log.info('Entity store disposed');
  }
}

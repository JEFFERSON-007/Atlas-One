/**
 * ObjectStore — In-memory store for all dynamic objects with spatial querying,
 * deduplication, automatic stale-object cleanup, and event bus integration.
 * Single source of truth for all moving objects.
 */

import {
  type DynamicObject,
  type PositionSnapshot,
  ObjectType,
  ObjectStatus,
  MAX_HISTORY_LENGTH,
} from '../dynamic-object.types';
import { eventBus } from '../../hooks/use-event-bus';
import { createLogger } from '../../utils/logger';

const log = createLogger('ObjectStore');

/** Maximum objects per type before oldest are pruned. */
const MAX_OBJECTS_PER_TYPE = 20_000;

/** How often to run stale cleanup (ms). */
const STALE_CHECK_INTERVAL = 30_000;

/** How long before an un-updated object is considered stale (ms). */
const STALE_THRESHOLD_MS = 120_000;

/**
 * In-memory store for all dynamic objects.
 * Provides add/update/remove/query operations with O(1) lookups by ID
 * and efficient queries by type.
 */
export class ObjectStore {
  /** Primary index: ID → Object. */
  private readonly objects = new Map<string, DynamicObject>();

  /** Secondary index: ObjectType → Set<ID>. */
  private readonly typeIndex = new Map<ObjectType, Set<string>>();

  /** Stale cleanup timer. */
  private staleTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    for (const type of Object.values(ObjectType)) {
      this.typeIndex.set(type, new Set());
    }
  }

  /**
   * Starts the automatic stale-object cleanup loop.
   */
  startStaleCleanup(): void {
    if (this.staleTimer) return;
    this.staleTimer = setInterval(() => {
      this.cleanStale();
    }, STALE_CHECK_INTERVAL);
  }

  /**
   * Adds or updates objects in the store.
   * Deduplicates by object ID — existing objects are updated in place.
   */
  upsert(objects: DynamicObject[]): void {
    let addedCount = 0;
    let updatedCount = 0;

    for (const obj of objects) {
      const existing = this.objects.get(obj.id);

      if (existing) {
        // Push current position to history buffer
        const snapshot: PositionSnapshot = {
          latitude: existing.latitude,
          longitude: existing.longitude,
          altitude: existing.altitude,
          heading: existing.heading,
          speed: existing.speed,
          timestamp: existing.timestamp,
        };
        obj.historyBuffer = [...existing.historyBuffer, snapshot].slice(-MAX_HISTORY_LENGTH);

        this.objects.set(obj.id, obj);
        updatedCount++;
      } else {
        this.objects.set(obj.id, obj);
        const typeSet = this.typeIndex.get(obj.type);
        if (typeSet) typeSet.add(obj.id);
        addedCount++;
      }
    }

    // Enforce per-type limits
    this.enforceTypeLimits();

    if (addedCount > 0 || updatedCount > 0) {
      eventBus.emit('objects:updated', {
        totalCount: this.objects.size,
        addedCount,
        updatedCount,
      });
    }
  }

  /**
   * Returns an object by ID.
   */
  get(id: string): DynamicObject | undefined {
    return this.objects.get(id);
  }

  /**
   * Returns all objects.
   */
  getAll(): DynamicObject[] {
    return Array.from(this.objects.values());
  }

  /**
   * Returns all objects of a specific type.
   */
  getByType(type: ObjectType): DynamicObject[] {
    const ids = this.typeIndex.get(type);
    if (!ids) return [];
    const result: DynamicObject[] = [];
    for (const id of ids) {
      const obj = this.objects.get(id);
      if (obj) result.push(obj);
    }
    return result;
  }

  /**
   * Returns objects counts by type.
   */
  getCountsByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [type, ids] of this.typeIndex) {
      counts[type] = ids.size;
    }
    return counts;
  }

  /**
   * Returns the total number of objects.
   */
  get size(): number {
    return this.objects.size;
  }

  /**
   * Removes an object by ID.
   */
  remove(id: string): void {
    const obj = this.objects.get(id);
    if (!obj) return;

    this.objects.delete(id);
    const typeSet = this.typeIndex.get(obj.type);
    if (typeSet) typeSet.delete(id);
  }

  /**
   * Removes all objects of a specific type.
   */
  removeByType(type: ObjectType): void {
    const ids = this.typeIndex.get(type);
    if (!ids) return;

    for (const id of ids) {
      this.objects.delete(id);
    }
    ids.clear();
    log.info(`Cleared all ${type} objects`);
  }

  /**
   * Clears all objects from the store.
   */
  clear(): void {
    this.objects.clear();
    for (const set of this.typeIndex.values()) {
      set.clear();
    }
  }

  /**
   * Removes objects that haven't been updated within the stale threshold.
   */
  private cleanStale(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [id, obj] of this.objects) {
      if (now - obj.timestamp.getTime() > STALE_THRESHOLD_MS) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.remove(id);
    }

    if (toRemove.length > 0) {
      log.info(`Cleaned ${toRemove.length} stale objects`);
    }
  }

  /**
   * Enforces maximum object count per type.
   * Removes oldest objects when limit is exceeded.
   */
  private enforceTypeLimits(): void {
    for (const [type, ids] of this.typeIndex) {
      if (ids.size <= MAX_OBJECTS_PER_TYPE) continue;

      const objects = Array.from(ids)
        .map((id) => this.objects.get(id))
        .filter((o): o is DynamicObject => o !== undefined)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      const toRemove = objects.slice(0, objects.length - MAX_OBJECTS_PER_TYPE);
      for (const obj of toRemove) {
        this.objects.delete(obj.id);
        ids.delete(obj.id);
      }

      if (toRemove.length > 0) {
        log.info(`Pruned ${toRemove.length} oldest ${type} objects`);
      }
    }
  }

  /**
   * Disposes the store and stops cleanup timers.
   */
  dispose(): void {
    if (this.staleTimer) {
      clearInterval(this.staleTimer);
      this.staleTimer = null;
    }
    this.clear();
    log.info('Object store disposed');
  }
}

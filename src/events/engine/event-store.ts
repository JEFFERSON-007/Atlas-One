/**
 * EventStore — In-memory event store with spatial querying, deduplication,
 * automatic expiration, and event bus integration.
 * The single source of truth for all Earth events.
 */

import {
  type EarthEvent,
  type EventBoundingRegion,
  type EventFilter,
  EventStatus,
  EventType,
} from '../earth-event.types';
import { eventBus } from '../../hooks/use-event-bus';
import { createLogger } from '../../utils/logger';

const log = createLogger('EventStore');

/** Maximum events per type before oldest are pruned. */
const MAX_EVENTS_PER_TYPE = 10_000;

/** How often to run expiration cleanup (ms). */
const EXPIRATION_CHECK_INTERVAL = 30_000;

/**
 * In-memory store for all Earth events.
 * Provides add/update/remove/query operations with O(1) lookups by ID
 * and efficient queries by type, region, and time.
 */
export class EventStore {
  /** Primary index: ID → Event. */
  private readonly events = new Map<string, EarthEvent>();

  /** Secondary index: EventType → Set<ID>. */
  private readonly typeIndex = new Map<EventType, Set<string>>();

  /** Expiration cleanup timer. */
  private expirationTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Initialize type index for all known types
    for (const type of Object.values(EventType)) {
      this.typeIndex.set(type, new Set());
    }
  }

  /**
   * Starts the automatic expiration cleanup loop.
   */
  startExpirationCleanup(): void {
    if (this.expirationTimer) return;
    this.expirationTimer = setInterval(() => {
      this.cleanExpired();
    }, EXPIRATION_CHECK_INTERVAL);
  }

  /**
   * Adds or updates events in the store.
   * Deduplicates by event ID — existing events are updated in place.
   *
   * @param events - Events to add/update
   */
  upsert(events: EarthEvent[]): void {
    const added: EarthEvent[] = [];
    const updated: EarthEvent[] = [];

    for (const event of events) {
      if (this.events.has(event.id)) {
        updated.push(event);
      } else {
        added.push(event);
      }
      this.events.set(event.id, event);

      // Maintain type index
      const typeSet = this.typeIndex.get(event.type);
      if (typeSet) {
        typeSet.add(event.id);
      }
    }

    // Enforce per-type limits
    this.enforceTypeLimits();

    if (added.length > 0) {
      eventBus.emit('events:added', {
        count: added.length,
        types: [...new Set(added.map((e) => e.type))],
      });
    }

    if (added.length > 0 || updated.length > 0) {
      eventBus.emit('events:updated', {
        totalCount: this.events.size,
        addedCount: added.length,
        updatedCount: updated.length,
      });
    }
  }

  /**
   * Removes an event by ID.
   */
  remove(id: string): boolean {
    const event = this.events.get(id);
    if (!event) return false;

    this.events.delete(id);
    const typeSet = this.typeIndex.get(event.type);
    if (typeSet) {
      typeSet.delete(id);
    }

    eventBus.emit('events:removed', { id, type: event.type });
    return true;
  }

  /**
   * Gets a single event by ID.
   */
  get(id: string): EarthEvent | undefined {
    return this.events.get(id);
  }

  /**
   * Returns all events, optionally filtered.
   */
  getAll(filter?: EventFilter): EarthEvent[] {
    let results = Array.from(this.events.values());

    if (filter) {
      results = this.applyFilter(results, filter);
    }

    return results;
  }

  /**
   * Returns events of a specific type.
   */
  getByType(type: EventType): EarthEvent[] {
    const ids = this.typeIndex.get(type);
    if (!ids) return [];

    const results: EarthEvent[] = [];
    for (const id of ids) {
      const event = this.events.get(id);
      if (event) results.push(event);
    }
    return results;
  }

  /**
   * Returns events within a geographic bounding region.
   */
  getByRegion(region: EventBoundingRegion): EarthEvent[] {
    return Array.from(this.events.values()).filter((e) =>
      e.latitude >= region.south &&
      e.latitude <= region.north &&
      e.longitude >= region.west &&
      e.longitude <= region.east,
    );
  }

  /**
   * Returns events within a time range.
   */
  getByTimeRange(start: Date, end: Date): EarthEvent[] {
    return Array.from(this.events.values()).filter(
      (e) => e.timestamp >= start && e.timestamp <= end,
    );
  }

  /**
   * Returns total event count.
   */
  get size(): number {
    return this.events.size;
  }

  /**
   * Returns count per event type.
   */
  getCountsByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [type, ids] of this.typeIndex) {
      counts[type] = ids.size;
    }
    return counts;
  }

  /**
   * Clears all events.
   */
  clear(): void {
    this.events.clear();
    for (const set of this.typeIndex.values()) {
      set.clear();
    }
    eventBus.emit('events:updated', { totalCount: 0, addedCount: 0, updatedCount: 0 });
  }

  /**
   * Disposes the store and stops cleanup timers.
   */
  dispose(): void {
    if (this.expirationTimer) {
      clearInterval(this.expirationTimer);
      this.expirationTimer = null;
    }
    this.clear();
    log.info('Event store disposed');
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  /**
   * Applies a filter to an event list.
   */
  private applyFilter(events: EarthEvent[], filter: EventFilter): EarthEvent[] {
    return events.filter((e) => {
      if (filter.types && filter.types.length > 0 && !filter.types.includes(e.type)) {
        return false;
      }
      if (filter.severities && filter.severities.length > 0 && !filter.severities.includes(e.severity)) {
        return false;
      }
      if (filter.statuses && filter.statuses.length > 0 && !filter.statuses.includes(e.status)) {
        return false;
      }
      if (filter.providers && filter.providers.length > 0 && !filter.providers.includes(e.providerName)) {
        return false;
      }
      if (filter.timeRange) {
        if (e.timestamp < filter.timeRange.start || e.timestamp > filter.timeRange.end) {
          return false;
        }
      }
      if (filter.confidenceMin !== undefined && e.confidence < filter.confidenceMin) {
        return false;
      }
      if (filter.magnitudeRange) {
        const mag = e.metadata['magnitude'] as number | undefined;
        if (mag !== undefined) {
          if (mag < filter.magnitudeRange.min || mag > filter.magnitudeRange.max) {
            return false;
          }
        }
      }
      if (filter.depthRange) {
        const depth = e.metadata['depth'] as number | undefined;
        if (depth !== undefined) {
          if (depth < filter.depthRange.min || depth > filter.depthRange.max) {
            return false;
          }
        }
      }
      if (filter.searchText) {
        const text = filter.searchText.toLowerCase();
        if (
          !e.title.toLowerCase().includes(text) &&
          !e.description.toLowerCase().includes(text)
        ) {
          return false;
        }
      }
      if (filter.boundingRegion) {
        const r = filter.boundingRegion;
        if (
          e.latitude < r.south ||
          e.latitude > r.north ||
          e.longitude < r.west ||
          e.longitude > r.east
        ) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Removes expired events.
   */
  private cleanExpired(): void {
    const now = new Date();
    const toRemove: string[] = [];

    for (const event of this.events.values()) {
      if (event.expiration && event.expiration <= now) {
        toRemove.push(event.id);
      }
      if (event.status === EventStatus.Expired || event.status === EventStatus.Archived) {
        toRemove.push(event.id);
      }
    }

    if (toRemove.length > 0) {
      for (const id of toRemove) {
        this.remove(id);
      }
      log.info(`Cleaned ${toRemove.length} expired events`);
    }
  }

  /**
   * Enforces maximum events per type by removing the oldest.
   */
  private enforceTypeLimits(): void {
    for (const [type, ids] of this.typeIndex) {
      if (ids.size <= MAX_EVENTS_PER_TYPE) continue;

      // Collect and sort by timestamp ascending (oldest first)
      const events: EarthEvent[] = [];
      for (const id of ids) {
        const e = this.events.get(id);
        if (e) events.push(e);
      }
      events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Remove oldest until within limit
      const excess = events.length - MAX_EVENTS_PER_TYPE;
      for (let i = 0; i < excess; i++) {
        const item = events[i];
        if (item) {
          this.events.delete(item.id);
          ids.delete(item.id);
        }
      }

      log.info(`Pruned ${excess} oldest ${type} events (limit: ${MAX_EVENTS_PER_TYPE})`);
    }
  }
}

/**
 * ClusterEngine — Spatial clustering for high-density event data.
 * Grid-based clustering that aggregates nearby events into cluster markers.
 * Zoom-aware: clusters expand as the user zooms in.
 */

import type { EarthEvent, EventSeverity } from '../earth-event.types';
import { EventSeverity as Severity, EventType, EVENT_TYPE_COLORS } from '../earth-event.types';

/** A cluster of nearby events. */
export interface EventCluster {
  /** Unique cluster ID. */
  id: string;
  /** Center latitude. */
  latitude: number;
  /** Center longitude. */
  longitude: number;
  /** Number of events in cluster. */
  count: number;
  /** Worst severity among clustered events. */
  maxSeverity: EventSeverity;
  /** Dominant event type. */
  dominantType: EventType;
  /** Representative color (worst severity color). */
  color: string;
  /** The actual events in this cluster. */
  events: EarthEvent[];
  /** Whether this is a single event (not clustered). */
  isSingle: boolean;
}

/** Severity ranking for comparison. */
const SEVERITY_RANK: Record<string, number> = {
  [Severity.Info]: 0,
  [Severity.Minor]: 1,
  [Severity.Moderate]: 2,
  [Severity.Major]: 3,
  [Severity.Severe]: 4,
  [Severity.Extreme]: 5,
};

/**
 * Clusters events spatially based on zoom level.
 */
export class ClusterEngine {
  private cellSizeDegrees = 5;
  private enabled = true;

  /**
   * Updates the grid cell size based on camera altitude (zoom level).
   *
   * @param altitude - Camera altitude in meters
   */
  updateForZoom(altitude: number): void {
    if (altitude > 10_000_000) {
      this.cellSizeDegrees = 10;
    } else if (altitude > 5_000_000) {
      this.cellSizeDegrees = 5;
    } else if (altitude > 2_000_000) {
      this.cellSizeDegrees = 2;
    } else if (altitude > 500_000) {
      this.cellSizeDegrees = 1;
    } else if (altitude > 100_000) {
      this.cellSizeDegrees = 0.5;
    } else {
      this.cellSizeDegrees = 0.1;
    }
  }

  /**
   * Clusters an array of events into spatial groups.
   *
   * @param events - Events to cluster
   * @returns Array of event clusters
   */
  cluster(events: EarthEvent[]): EventCluster[] {
    if (!this.enabled || events.length === 0) {
      return events.map((e) => ({
        id: e.id,
        latitude: e.latitude,
        longitude: e.longitude,
        count: 1,
        maxSeverity: e.severity,
        dominantType: e.type,
        color: e.color,
        events: [e],
        isSingle: true,
      }));
    }

    const grid = new Map<string, EarthEvent[]>();

    for (const event of events) {
      const cellX = Math.floor(event.longitude / this.cellSizeDegrees);
      const cellY = Math.floor(event.latitude / this.cellSizeDegrees);
      const key = `${cellX},${cellY}`;

      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key)!.push(event);
    }

    const clusters: EventCluster[] = [];

    for (const [key, cellEvents] of grid) {
      if (cellEvents.length === 1) {
        const e = cellEvents[0];
        if (!e) continue;
        clusters.push({
          id: e.id,
          latitude: e.latitude,
          longitude: e.longitude,
          count: 1,
          maxSeverity: e.severity,
          dominantType: e.type,
          color: e.color,
          events: [e],
          isSingle: true,
        });
      } else {
        const center = this.computeCenter(cellEvents);
        const maxSeverity = this.getMaxSeverity(cellEvents);
        const dominantType = this.getDominantType(cellEvents);

        clusters.push({
          id: `cluster-${key}`,
          latitude: center.lat,
          longitude: center.lng,
          count: cellEvents.length,
          maxSeverity,
          dominantType,
          color: EVENT_TYPE_COLORS[dominantType] || '#94a3b8',
          events: cellEvents,
          isSingle: false,
        });
      }
    }

    return clusters;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private computeCenter(events: EarthEvent[]): { lat: number; lng: number } {
    let latSum = 0;
    let lngSum = 0;
    for (const e of events) {
      latSum += e.latitude;
      lngSum += e.longitude;
    }
    return {
      lat: latSum / (events.length || 1),
      lng: lngSum / (events.length || 1),
    };
  }

  private getMaxSeverity(events: EarthEvent[]): EventSeverity {
    let maxRank = 0;
    let maxSev: EventSeverity = Severity.Info;
    for (const e of events) {
      const rank = SEVERITY_RANK[e.severity] ?? 0;
      if (rank > maxRank) {
        maxRank = rank;
        maxSev = e.severity;
      }
    }
    return maxSev;
  }

  private getDominantType(events: EarthEvent[]): EventType {
    const counts = new Map<EventType, number>();
    for (const e of events) {
      counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
    }
    let dominant: EventType = events[0]?.type ?? EventType.Custom;
    let maxCount = 0;
    for (const [type, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        dominant = type;
      }
    }
    return dominant;
  }
}

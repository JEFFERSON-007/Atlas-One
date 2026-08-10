/**
 * SelectionManager — Unified entity selection pipeline for all clicked features:
 * Countries, Cities, 3D Buildings, Airports, Ports, Infrastructure, Aircraft, Ships,
 * Satellites, Earthquakes, Wildfires, Volcanoes.
 *
 * Emits unified `selection:changed` event containing complete target payload.
 */

import {
  Cartesian2,
  Entity,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Viewer,
} from 'cesium';
import type { GeospatialEntityEngine } from '../entity/geospatial-entity-engine';
import type { RelatedEntitySystem, RelatedEntityGraph } from '../context/related-entity-system';
import { eventBus } from '../../hooks/use-event-bus';
import { createLogger } from '../../utils/logger';

const log = createLogger('SelectionManager');

export type SelectionTargetType =
  | 'entity'
  | 'event'
  | 'object'
  | 'building'
  | 'none';

export interface SelectionPayload {
  type: SelectionTargetType;
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  rawTarget: unknown;
  graph?: RelatedEntityGraph;
}

export class SelectionManager {
  private viewer: Viewer | null = null;
  private handler: ScreenSpaceEventHandler | null = null;
  private entityEngine: GeospatialEntityEngine | null = null;
  private relatedSystem: RelatedEntitySystem | null = null;
  private selectedPayload: SelectionPayload | null = null;

  init(
    viewer: Viewer,
    entityEngine: GeospatialEntityEngine,
    relatedSystem?: RelatedEntitySystem,
  ): void {
    this.viewer = viewer;
    this.entityEngine = entityEngine;
    this.relatedSystem = relatedSystem;

    this.handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

    // Single click handler for all scene elements
    this.handler.setInputAction((click: { position: Cartesian2 }) => {
      this.handlePick(click.position);
    }, ScreenSpaceEventType.LEFT_CLICK);

    log.info('Unified Selection Manager initialized');
  }

  /** Performs picking and normalizes selection payload. */
  private async handlePick(position: Cartesian2): Promise<void> {
    if (!this.viewer) return;

    const picked = this.viewer.scene.pick(position) as { id?: Entity } | undefined;
    const entity = picked?.id;

    if (entity instanceof Entity) {
      const meta = entity as Entity & {
        entityId?: string;
        entityType?: string;
        eventId?: string;
        objectId?: string;
      };

      if (meta.entityId && this.entityEngine) {
        const item = this.entityEngine.store.get(meta.entityId);
        if (item) {
          const graph = this.relatedSystem ? await this.relatedSystem.buildGraph(item) : undefined;
          this.select({
            type: 'entity',
            id: item.id,
            name: item.name,
            latitude: item.latitude,
            longitude: item.longitude,
            rawTarget: item,
            graph,
          });
          return;
        }
      }

      if (meta.eventId) {
        eventBus.emit('event:select', { eventId: meta.eventId });
        return;
      }

      if (meta.objectId) {
        eventBus.emit('object:select', { objectId: meta.objectId });
        return;
      }
    }
  }

  /** Selects a payload directly and emits selection event. */
  select(payload: SelectionPayload): void {
    this.selectedPayload = payload;
    log.info(`Selected ${payload.type}: ${payload.name} (${payload.id})`);

    eventBus.emit('selection:changed', payload);
  }

  /** Clears selection. */
  clearSelection(): void {
    this.selectedPayload = null;
    eventBus.emit('selection:changed', {
      type: 'none',
      id: '',
      name: '',
      latitude: 0,
      longitude: 0,
      rawTarget: null,
    });
  }

  /** Returns current selection payload. */
  getSelection(): SelectionPayload | null {
    return this.selectedPayload;
  }

  dispose(): void {
    if (this.handler) {
      this.handler.destroy();
      this.handler = null;
    }
    this.viewer = null;
    log.info('Selection Manager disposed');
  }
}

/**
 * EventRenderer — Manages all event entities on the Cesium viewer.
 * Uses entity pooling, batched updates, and viewport-aware rendering.
 * Subscribes to event bus for data changes and emits selection events.
 */

import {
  Cartesian2,
  Cartesian3,
  Color,
  ConstantPositionProperty,
  ConstantProperty,
  Entity,
  HorizontalOrigin,
  LabelStyle,
  NearFarScalar,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  VerticalOrigin,
  type Viewer,
} from 'cesium';
import type { EarthEvent, EventType } from '../earth-event.types';
import { createMarkerProperties, clearMarkerCache } from './marker-factory';
import { eventBus } from '../../hooks/use-event-bus';
import { createLogger } from '../../utils/logger';

const log = createLogger('EventRenderer');

/** Maximum entities to update per render cycle to maintain 60fps. */
const MAX_UPDATES_PER_FRAME = 100;

/**
 * Manages rendering of Earth event entities on the Cesium globe.
 */
export class EventRenderer {
  private viewer: Viewer | null = null;
  private readonly entityMap = new Map<string, Entity>();
  private readonly typeVisibility = new Map<string, boolean>();
  private unsubscribers: Array<() => void> = [];

  /**
   * Initializes the renderer with a Cesium viewer.
   */
  init(viewer: Viewer): void {
    this.viewer = viewer;

    // Listen for event updates
    this.unsubscribers.push(
      eventBus.on('events:updated', () => {
        // Re-render handled by explicit calls from layers
      }),
    );

    // Handle click detection
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: { position: Cartesian2 }) => {
      const picked = viewer.scene.pick(click.position) as { id?: Entity } | undefined;
      const entity = picked?.id;
      if (entity instanceof Entity) {
        const eventId = (entity as Entity & { eventId?: string }).eventId;
        if (eventId) {
          eventBus.emit('event:select', { eventId });
        }
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    log.info('Event renderer initialized');
  }

  /**
   * Renders a batch of events as entities on the globe.
   * Uses upsert logic — existing entities are updated, new ones created.
   *
   * @param events - Events to render
   */
  renderEvents(events: EarthEvent[]): void {
    if (!this.viewer) return;

    const toProcess = events.slice(0, MAX_UPDATES_PER_FRAME);
    const remaining = events.slice(MAX_UPDATES_PER_FRAME);

    for (const event of toProcess) {
      // Skip if type is hidden
      if (this.typeVisibility.get(event.type) === false) continue;

      const existing = this.entityMap.get(event.id);
      if (existing) {
        this.updateEntity(existing, event);
      } else {
        this.createEntity(event);
      }
    }

    // Process remaining in next frame
    if (remaining.length > 0) {
      requestAnimationFrame(() => {
        this.renderEvents(remaining);
      });
    }
  }

  /**
   * Removes entities for events no longer in the dataset.
   *
   * @param currentIds - Set of current event IDs to keep
   */
  pruneStaleEntities(currentIds: Set<string>): void {
    if (!this.viewer) return;

    const toRemove: string[] = [];
    for (const [id] of this.entityMap) {
      if (!currentIds.has(id)) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.removeEntity(id);
    }

    if (toRemove.length > 0) {
      log.info(`Pruned ${toRemove.length} stale event entities`);
    }
  }

  /**
   * Shows or hides all entities of a specific event type.
   */
  setTypeVisible(type: EventType, visible: boolean): void {
    this.typeVisibility.set(type, visible);

    for (const [, entity] of this.entityMap) {
      const eventData = entity as Entity & { eventType?: string };
      if (eventData.eventType === type) {
        entity.show = visible;
      }
    }
  }

  /**
   * Removes all rendered entities.
   */
  clearAll(): void {
    if (!this.viewer) return;

    for (const [id, entity] of this.entityMap) {
      this.viewer.entities.remove(entity);
      this.entityMap.delete(id);
    }
  }

  /**
   * Returns the total number of rendered entities.
   */
  get entityCount(): number {
    return this.entityMap.size;
  }

  /**
   * Cleans up all resources.
   */
  dispose(): void {
    this.clearAll();
    clearMarkerCache();
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
    this.viewer = null;
    log.info('Event renderer disposed');
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private createEntity(event: EarthEvent): void {
    if (!this.viewer) return;

    const marker = createMarkerProperties(event);
    const position = Cartesian3.fromDegrees(event.longitude, event.latitude);

    const entity = this.viewer.entities.add({
      position: new ConstantPositionProperty(position),
      billboard: {
        image: new ConstantProperty(marker.image),
        width: new ConstantProperty(marker.width),
        height: new ConstantProperty(marker.height),
        horizontalOrigin: new ConstantProperty(HorizontalOrigin.CENTER),
        verticalOrigin: new ConstantProperty(VerticalOrigin.CENTER),
        scaleByDistance: new ConstantProperty(new NearFarScalar(1.5e5, 1.5, 1.5e7, 0.3)),
        translucencyByDistance: new ConstantProperty(new NearFarScalar(1.5e5, 1.0, 2.5e7, 0.4)),
        disableDepthTestDistance: new ConstantProperty(Number.POSITIVE_INFINITY),
      },
      label: {
        text: new ConstantProperty(marker.label),
        font: new ConstantProperty('12px Inter, sans-serif'),
        fillColor: new ConstantProperty(Color.WHITE),
        outlineColor: new ConstantProperty(Color.BLACK),
        outlineWidth: new ConstantProperty(2),
        style: new ConstantProperty(LabelStyle.FILL_AND_OUTLINE),
        horizontalOrigin: new ConstantProperty(HorizontalOrigin.LEFT),
        verticalOrigin: new ConstantProperty(VerticalOrigin.CENTER),
        pixelOffset: new ConstantProperty(new Cartesian2(20, 0)),
        scaleByDistance: new ConstantProperty(new NearFarScalar(1.5e5, 1.0, 5.0e6, 0.0)),
        showBackground: new ConstantProperty(true),
        backgroundColor: new ConstantProperty(new Color(0.04, 0.06, 0.09, 0.8)),
        backgroundPadding: new ConstantProperty(new Cartesian2(6, 4)),
        disableDepthTestDistance: new ConstantProperty(Number.POSITIVE_INFINITY),
      },
      show: event.visible,
    });

    // Attach event metadata to entity for click detection
    (entity as Entity & { eventId?: string; eventType?: string }).eventId = event.id;
    (entity as Entity & { eventId?: string; eventType?: string }).eventType = event.type;

    this.entityMap.set(event.id, entity);
  }

  private updateEntity(entity: Entity, event: EarthEvent): void {
    const marker = createMarkerProperties(event);

    if (entity.billboard) {
      entity.billboard.image = new ConstantProperty(marker.image);
      entity.billboard.width = new ConstantProperty(marker.width);
      entity.billboard.height = new ConstantProperty(marker.height);
    }

    if (entity.label) {
      entity.label.text = new ConstantProperty(marker.label);
    }

    entity.show = event.visible && this.typeVisibility.get(event.type) !== false;
  }

  private removeEntity(id: string): void {
    const entity = this.entityMap.get(id);
    if (entity && this.viewer) {
      this.viewer.entities.remove(entity);
      this.entityMap.delete(id);
    }
  }
}

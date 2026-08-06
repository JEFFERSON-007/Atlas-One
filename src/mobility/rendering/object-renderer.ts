/**
 * ObjectRenderer — Unified renderer for ALL dynamic objects on the Cesium globe.
 * Uses entity pooling, viewport culling, LOD scaling, batched updates.
 * Handles billboard rotation for aircraft/ships and altitude-aware rendering.
 */

import {
  Cartesian2,
  Cartesian3,
  Color,
  ConstantPositionProperty,
  ConstantProperty,
  Entity,
  HeightReference,
  HorizontalOrigin,
  LabelStyle,
  Math as CesiumMath,
  NearFarScalar,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  VerticalOrigin,
  type Viewer,
} from 'cesium';
import type { DynamicObject } from '../dynamic-object.types';
import { ObjectType } from '../dynamic-object.types';
import { createMobilityMarker, clearMobilityMarkerCache } from './mobility-marker-factory';
import { eventBus } from '../../hooks/use-event-bus';
import { createLogger } from '../../utils/logger';

const log = createLogger('ObjectRenderer');

/** Maximum entities to update per frame to maintain 60fps. */
const MAX_UPDATES_PER_FRAME = 200;

/**
 * Manages rendering of dynamic objects on the Cesium globe.
 */
export class ObjectRenderer {
  private viewer: Viewer | null = null;
  private readonly entityMap = new Map<string, Entity>();
  private readonly typeVisibility = new Map<string, boolean>();
  private unsubscribers: Array<() => void> = [];

  /**
   * Initializes the renderer with a Cesium viewer.
   */
  init(viewer: Viewer): void {
    this.viewer = viewer;

    // Handle click detection
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: { position: Cartesian2 }) => {
      const picked = viewer.scene.pick(click.position) as { id?: Entity } | undefined;
      const entity = picked?.id;
      if (entity instanceof Entity) {
        const objectId = (entity as Entity & { objectId?: string }).objectId;
        if (objectId) {
          eventBus.emit('object:select', { objectId });
        }
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    log.info('Object renderer initialized');
  }

  /**
   * Renders a batch of objects as entities on the globe.
   * Uses upsert logic — existing entities are updated, new ones created.
   */
  renderObjects(objects: DynamicObject[]): void {
    if (!this.viewer) return;

    const toProcess = objects.slice(0, MAX_UPDATES_PER_FRAME);
    const remaining = objects.slice(MAX_UPDATES_PER_FRAME);

    for (const obj of toProcess) {
      if (this.typeVisibility.get(obj.type) === false) continue;

      const existing = this.entityMap.get(obj.id);
      if (existing) {
        this.updateEntity(existing, obj);
      } else {
        this.createEntity(obj);
      }
    }

    if (remaining.length > 0) {
      requestAnimationFrame(() => {
        this.renderObjects(remaining);
      });
    }
  }

  /**
   * Removes entities for objects no longer in the dataset.
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
      log.info(`Pruned ${toRemove.length} stale object entities`);
    }
  }

  /**
   * Shows or hides all entities of a specific type.
   */
  setTypeVisible(type: ObjectType, visible: boolean): void {
    this.typeVisibility.set(type, visible);

    for (const [, entity] of this.entityMap) {
      const meta = entity as Entity & { objectType?: string };
      if (meta.objectType === type) {
        entity.show = visible;
      }
    }
  }

  /**
   * Removes all entities of a specific type.
   */
  removeByType(type: ObjectType): void {
    if (!this.viewer) return;

    const toRemove: string[] = [];
    for (const [id, entity] of this.entityMap) {
      const meta = entity as Entity & { objectType?: string };
      if (meta.objectType === type) {
        this.viewer.entities.remove(entity);
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      this.entityMap.delete(id);
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
    clearMobilityMarkerCache();
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
    this.viewer = null;
    log.info('Object renderer disposed');
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private createEntity(obj: DynamicObject): void {
    if (!this.viewer) return;

    const marker = createMobilityMarker(obj);
    const isOrbital = this.isOrbitalType(obj.type);

    const position = isOrbital
      ? Cartesian3.fromDegrees(obj.longitude, obj.latitude, obj.altitude)
      : Cartesian3.fromDegrees(obj.longitude, obj.latitude);

    const entity = this.viewer.entities.add({
      position: new ConstantPositionProperty(position),
      billboard: {
        image: new ConstantProperty(marker.image),
        width: new ConstantProperty(marker.width),
        height: new ConstantProperty(marker.height),
        horizontalOrigin: new ConstantProperty(HorizontalOrigin.CENTER),
        verticalOrigin: new ConstantProperty(VerticalOrigin.CENTER),
        rotation: new ConstantProperty(
          this.shouldRotate(obj.type) ? CesiumMath.toRadians(-obj.heading) : 0,
        ),
        scaleByDistance: new ConstantProperty(new NearFarScalar(1.5e5, 1.5, 1.5e7, 0.2)),
        translucencyByDistance: new ConstantProperty(new NearFarScalar(1.5e5, 1.0, 2.5e7, 0.3)),
        heightReference: new ConstantProperty(
          isOrbital ? HeightReference.NONE : HeightReference.CLAMP_TO_GROUND,
        ),
      },
      label: {
        text: new ConstantProperty(marker.label),
        font: new ConstantProperty('11px Inter, sans-serif'),
        fillColor: new ConstantProperty(Color.WHITE),
        outlineColor: new ConstantProperty(Color.BLACK),
        outlineWidth: new ConstantProperty(2),
        style: new ConstantProperty(LabelStyle.FILL_AND_OUTLINE),
        horizontalOrigin: new ConstantProperty(HorizontalOrigin.LEFT),
        verticalOrigin: new ConstantProperty(VerticalOrigin.CENTER),
        pixelOffset: new ConstantProperty(new Cartesian2(18, 0)),
        scaleByDistance: new ConstantProperty(new NearFarScalar(1.5e5, 1.0, 3.0e6, 0.0)),
        showBackground: new ConstantProperty(true),
        backgroundColor: new ConstantProperty(new Color(0.04, 0.06, 0.09, 0.8)),
        backgroundPadding: new ConstantProperty(new Cartesian2(5, 3)),
      },
      show: obj.visible,
    });

    // Attach metadata for click detection
    const enhanced = entity as Entity & { objectId?: string; objectType?: string };
    enhanced.objectId = obj.id;
    enhanced.objectType = obj.type;

    this.entityMap.set(obj.id, entity);
  }

  private updateEntity(entity: Entity, obj: DynamicObject): void {
    const isOrbital = this.isOrbitalType(obj.type);

    const position = isOrbital
      ? Cartesian3.fromDegrees(obj.longitude, obj.latitude, obj.altitude)
      : Cartesian3.fromDegrees(obj.longitude, obj.latitude);

    entity.position = new ConstantPositionProperty(position);

    if (entity.billboard) {
      if (this.shouldRotate(obj.type)) {
        entity.billboard.rotation = new ConstantProperty(
          CesiumMath.toRadians(-obj.heading),
        );
      }
    }

    entity.show = obj.visible && this.typeVisibility.get(obj.type) !== false;
  }

  private removeEntity(id: string): void {
    const entity = this.entityMap.get(id);
    if (entity && this.viewer) {
      this.viewer.entities.remove(entity);
      this.entityMap.delete(id);
    }
  }

  private isOrbitalType(type: ObjectType): boolean {
    return (
      type === ObjectType.Satellite ||
      type === ObjectType.ISS ||
      type === ObjectType.Starlink ||
      type === ObjectType.GPS ||
      type === ObjectType.GLONASS ||
      type === ObjectType.Galileo ||
      type === ObjectType.BeiDou
    );
  }

  private shouldRotate(type: ObjectType): boolean {
    return type === ObjectType.Aircraft || type === ObjectType.Ship;
  }
}

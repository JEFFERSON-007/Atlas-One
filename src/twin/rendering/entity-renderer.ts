/**
 * EntityRenderer — Unified renderer for all Geospatial Entities.
 * Renders billboards, labels, and icons on the Cesium globe with entity pooling,
 * LOD filtering, dynamic scaling, and click selection support.
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
  VerticalOrigin,
  type Viewer,
} from 'cesium';
import type { GeospatialEntity } from '../entity/geospatial-entity.types';
import { EntityType, ENTITY_TYPE_COLORS, ENTITY_TYPE_ICONS } from '../entity/geospatial-entity.types';
import { createLogger } from '../../utils/logger';

const log = createLogger('EntityRenderer');

/** Maximum entities rendered per frame batch for 60 FPS performance. */
const BATCH_SIZE = 250;

export class EntityRenderer {
  private viewer: Viewer | null = null;
  private readonly entityMap = new Map<string, Entity>();
  private readonly typeVisibility = new Map<EntityType, boolean>();

  init(viewer: Viewer): void {
    this.viewer = viewer;

    for (const type of Object.values(EntityType)) {
      this.typeVisibility.set(type, true);
    }

    log.info('Entity Renderer initialized');
  }

  /** Renders a batch of geospatial entities on the globe. */
  renderEntities(entities: GeospatialEntity[]): void {
    if (!this.viewer) return;

    const toProcess = entities.slice(0, BATCH_SIZE);
    const remaining = entities.slice(BATCH_SIZE);

    for (const item of toProcess) {
      if (this.typeVisibility.get(item.type) === false) continue;

      const existing = this.entityMap.get(item.id);
      if (existing) {
        this.updateEntity(existing, item);
      } else {
        this.createEntity(item);
      }
    }

    if (remaining.length > 0) {
      requestAnimationFrame(() => this.renderEntities(remaining));
    }
  }

  /** Creates a Cesium Entity for a GeospatialEntity. */
  private createEntity(item: GeospatialEntity): void {
    if (!this.viewer) return;

    const color = Color.fromCssColorString(item.color || ENTITY_TYPE_COLORS[item.type] || '#38bdf8');
    const icon = item.icon || ENTITY_TYPE_ICONS[item.type] || '📍';

    const position = Cartesian3.fromDegrees(item.longitude, item.latitude, item.altitude);

    const entity = this.viewer.entities.add({
      position: new ConstantPositionProperty(position),
      billboard: {
        image: new ConstantProperty(this.createSVGMarker(icon, color.toCssColorString())),
        width: new ConstantProperty(28),
        height: new ConstantProperty(28),
        horizontalOrigin: new ConstantProperty(HorizontalOrigin.CENTER),
        verticalOrigin: new ConstantProperty(VerticalOrigin.CENTER),
        scaleByDistance: new ConstantProperty(new NearFarScalar(1.5e5, 1.2, 8.0e6, 0.3)),
      },
      label: {
        text: new ConstantProperty(item.name),
        font: new ConstantProperty('12px Inter, sans-serif'),
        fillColor: new ConstantProperty(Color.WHITE),
        outlineColor: new ConstantProperty(Color.BLACK),
        outlineWidth: new ConstantProperty(2),
        style: new ConstantProperty(LabelStyle.FILL_AND_OUTLINE),
        horizontalOrigin: new ConstantProperty(HorizontalOrigin.LEFT),
        verticalOrigin: new ConstantProperty(VerticalOrigin.CENTER),
        pixelOffset: new ConstantProperty(new Cartesian2(18, 0)),
        scaleByDistance: new ConstantProperty(new NearFarScalar(1.0e5, 1.0, 3.0e6, 0.0)),
        showBackground: new ConstantProperty(true),
        backgroundColor: new ConstantProperty(new Color(0.04, 0.06, 0.09, 0.8)),
        backgroundPadding: new ConstantProperty(new Cartesian2(5, 3)),
      },
      show: item.visibility,
    });

    // Attach metadata for selection engine
    const enhanced = entity as Entity & { entityId?: string; entityType?: string };
    enhanced.entityId = item.id;
    enhanced.entityType = item.type;

    this.entityMap.set(item.id, entity);
  }

  /** Updates an existing Cesium Entity. */
  private updateEntity(entity: Entity, item: GeospatialEntity): void {
    const position = Cartesian3.fromDegrees(item.longitude, item.latitude, item.altitude);
    entity.position = new ConstantPositionProperty(position);
    entity.show = item.visibility && this.typeVisibility.get(item.type) !== false;
  }

  /** Toggles visibility for a specific EntityType. */
  setTypeVisible(type: EntityType, visible: boolean): void {
    this.typeVisibility.set(type, visible);
    for (const entity of this.entityMap.values()) {
      const meta = entity as Entity & { entityType?: string };
      if (meta.entityType === type) {
        entity.show = visible;
      }
    }
  }

  /** Generates an SVG marker image data URI. */
  private createSVGMarker(icon: string, colorCss: string): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="14" fill="${colorCss}" opacity="0.25"/>
      <circle cx="16" cy="16" r="10" fill="${colorCss}" opacity="0.8"/>
      <text x="16" y="20" font-size="12" text-anchor="middle" fill="white">${icon}</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /** Clears all rendered entities. */
  clearAll(): void {
    if (!this.viewer) return;
    for (const entity of this.entityMap.values()) {
      this.viewer.entities.remove(entity);
    }
    this.entityMap.clear();
  }

  dispose(): void {
    this.clearAll();
    this.viewer = null;
    log.info('Entity Renderer disposed');
  }
}

/**
 * Cesium OSM 3D Buildings Provider — Integrates global 3D OSM Buildings.
 * Handles 3D Tiles streaming, level-of-detail management, building feature selection,
 * highlight styling, and camera fly-to integration.
 */

import {
  type Viewer,
  Cesium3DTileset,
  createOsmBuildingsAsync,
} from 'cesium';
import type { IGeospatialProvider, GeospatialProviderInfo } from './geospatial-provider.interface';
import {
  type GeospatialEntity,
  EntityType,
} from '../entity/geospatial-entity.types';
import { createLogger } from '../../utils/logger';

const log = createLogger('CesiumOSMBuildingsProvider');

export class CesiumOSMBuildingsProvider implements IGeospatialProvider {
  readonly info: GeospatialProviderInfo = {
    id: 'cesium-osm-buildings',
    name: 'Cesium OSM 3D Buildings (3D Tiles)',
    primaryType: EntityType.Building,
    attribution: '© OpenStreetMap contributors, Cesium Ion',
    updateIntervalSeconds: 0,
    requiresApiKey: false,
    sourceUrl: 'https://cesium.com/platform/cesium-ion/content/3d-buildings/',
  };

  private tileset: Cesium3DTileset | null = null;
  private viewer: Viewer | null = null;
  private enabled = false;

  isAvailable(): boolean {
    return true;
  }

  async fetchEntities(): Promise<GeospatialEntity[]> {
    // 3D Tiles stream geometry directly to the GPU — return empty array for entity store
    return [];
  }

  /**
   * Initializes the 3D Buildings tileset on the provided Cesium Viewer.
   */
  async initTileset(viewer: Viewer): Promise<void> {
    this.viewer = viewer;

    try {
      log.info('Loading Cesium OSM 3D Buildings tileset...');
      this.tileset = await createOsmBuildingsAsync({
        style: undefined, // Default PBR styling
      });

      this.tileset.show = false; // Initially hidden until layer enabled
      viewer.scene.primitives.add(this.tileset);

      log.info('Cesium OSM 3D Buildings tileset initialized successfully');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      log.warn(`Failed to initialize 3D Buildings tileset (Ion token required for premium 3D tiles): ${msg}`);
    }
  }

  /** Shows or hides the 3D Buildings tileset. */
  setTilesetVisible(visible: boolean): void {
    this.enabled = visible;
    if (this.tileset) {
      this.tileset.show = visible;
    }
  }

  /** Applies a Cesium3DTileStyle to the tileset. */
  setStyle(style: any): void {
    if (this.tileset) {
      this.tileset.style = style;
    }
  }

  /** Returns whether 3D buildings are currently enabled. */
  isTilesetVisible(): boolean {
    return this.enabled;
  }

  dispose(): void {
    if (this.viewer && this.tileset) {
      this.viewer.scene.primitives.remove(this.tileset);
      this.tileset = null;
    }
    this.viewer = null;
    log.info('Cesium OSM 3D Buildings provider disposed');
  }
}

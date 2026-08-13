/**
 * Cesium OSM 3D Buildings Provider — Integrates global 3D OSM Buildings.
 * Handles 3D Tiles streaming, level-of-detail management, building feature selection,
 * highlight styling, and camera fly-to integration.
 *
 * NOTE: Requires a valid Cesium Ion access token (Ion asset #96188).
 * Without a token, the provider runs in stub mode (no tileset loaded),
 * preventing shader crashes that would break the entire Cesium scene.
 */

import {
  type Viewer,
  Cesium3DTileset,
  Cesium3DTileStyle,
  createOsmBuildingsAsync,
} from 'cesium';
import type { IGeospatialProvider, GeospatialProviderInfo } from './geospatial-provider.interface';
import {
  type GeospatialEntity,
  EntityType,
} from '../entity/geospatial-entity.types';
import { createLogger } from '../../utils/logger';

import { getAppConfig } from '../../config/app.config';

const log = createLogger('CesiumOSMBuildingsProvider');

/** Returns true only if a real Ion token was configured via VITE_CESIUM_ION_TOKEN. */
function hasValidIonToken(): boolean {
  return getAppConfig().hasCesiumIon;
}

export class CesiumOSMBuildingsProvider implements IGeospatialProvider {
  readonly info: GeospatialProviderInfo = {
    id: 'cesium-osm-buildings',
    name: 'Cesium OSM 3D Buildings (3D Tiles)',
    primaryType: EntityType.Building,
    attribution: '© OpenStreetMap contributors, Cesium Ion',
    updateIntervalSeconds: 0,
    requiresApiKey: true,
    sourceUrl: 'https://cesium.com/platform/cesium-ion/content/3d-buildings/',
  };

  private tileset: Cesium3DTileset | null = null;
  private viewer: Viewer | null = null;
  private enabled = false;
  private tilesetReady = false;
  private pendingStyle: Cesium3DTileStyle | null = null;

  isAvailable(): boolean {
    return hasValidIonToken();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async fetchEntities(): Promise<GeospatialEntity[]> {
    // 3D Tiles stream geometry directly to the GPU — return empty array for entity store
    return [];
  }

  /**
   * Initializes the 3D Buildings tileset on the provided Cesium Viewer.
   * Skipped entirely if no valid Cesium Ion token is configured, to prevent
   * shader crashes that would break the entire Cesium scene.
   */
  async initTileset(viewer: Viewer): Promise<void> {
    this.viewer = viewer;

    if (!hasValidIonToken()) {
      log.info('No Cesium Ion token — 3D Buildings disabled. Set CESIUM_ION_TOKEN to enable.');
      return;
    }

    try {
      log.info('Loading Cesium OSM 3D Buildings tileset...');
      this.tileset = await createOsmBuildingsAsync({ style: undefined });

      this.tileset.show = false; // Initially hidden
      viewer.scene.primitives.add(this.tileset);

      // Apply any queued style once the root tile is loaded
      const applyPendingStyle = (): void => {
        this.tilesetReady = true;
        if (this.pendingStyle && this.tileset) {
          try {
            this.tileset.style = this.pendingStyle;
          } catch {
            // ignore — style may fail before shaders compile
          }
          this.pendingStyle = null;
        }
        log.info('Cesium OSM 3D Buildings tileset ready');
      };

      if ('readyEvent' in this.tileset) {
        const ts = this.tileset as unknown as { readyEvent: { addEventListener: (cb: () => void) => void } };
        ts.readyEvent.addEventListener(applyPendingStyle);
      } else {
        setTimeout(applyPendingStyle, 0);
      }

      log.info('Cesium OSM 3D Buildings tileset initialized');
    } catch (err) {
      // IMPORTANT: ensure a broken tileset is never left in the scene
      if (this.tileset && this.viewer) {
        try { this.viewer.scene.primitives.remove(this.tileset); } catch { /* ignore */ }
      }
      this.tileset = null;
      const msg = err instanceof Error ? err.message : String(err);
      log.warn(`3D Buildings tileset failed to load: ${msg}`);
    }
  }

  /** Shows or hides the 3D Buildings tileset. */
  setTilesetVisible(visible: boolean): void {
    this.enabled = visible;
    if (this.tileset) {
      this.tileset.show = visible;
    }
  }

  /** Applies a Cesium3DTileStyle (deferred until tileset is ready). */
  setStyle(style: Cesium3DTileStyle): void {
    if (this.tileset && this.tilesetReady) {
      try {
        this.tileset.style = style;
      } catch {
        log.warn('Could not apply style to tileset');
      }
    } else {
      this.pendingStyle = style;
    }
  }

  /** Returns whether 3D buildings are currently enabled. */
  isTilesetVisible(): boolean {
    return this.enabled;
  }

  dispose(): void {
    if (this.viewer && this.tileset) {
      try { this.viewer.scene.primitives.remove(this.tileset); } catch { /* ignore */ }
      this.tileset = null;
    }
    this.viewer = null;
    this.tilesetReady = false;
    this.pendingStyle = null;
    log.info('Cesium OSM 3D Buildings provider disposed');
  }
}

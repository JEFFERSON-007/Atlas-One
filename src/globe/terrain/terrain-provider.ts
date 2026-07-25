/**
 * TerrainManager — Configures terrain providers with graceful fallback.
 * Uses Cesium World Terrain when Ion token is available, otherwise EllipsoidTerrainProvider.
 */

import {
  type Viewer,
  CesiumTerrainProvider,
  EllipsoidTerrainProvider,
  createWorldTerrainAsync,
} from 'cesium';
import { createLogger } from '../../utils/logger';

const log = createLogger('TerrainManager');

/**
 * Manages terrain provider selection and configuration.
 */
export class TerrainManager {
  private viewer: Viewer | null = null;
  private enabled = true;
  private flatTerrain: EllipsoidTerrainProvider | null = null;
  private worldTerrain: CesiumTerrainProvider | null = null;

  /**
   * Initializes terrain with appropriate provider.
   *
   * @param viewer - CesiumJS Viewer instance
   * @param hasIonToken - Whether a Cesium Ion token is available
   */
  async init(viewer: Viewer, hasIonToken: boolean): Promise<void> {
    this.viewer = viewer;
    this.flatTerrain = new EllipsoidTerrainProvider();

    if (hasIonToken) {
      try {
        this.worldTerrain = await createWorldTerrainAsync({
          requestVertexNormals: true,
          requestWaterMask: true,
        });
        viewer.terrainProvider = this.worldTerrain;
        log.info('Cesium World Terrain loaded');
      } catch (error) {
        log.warn('Failed to load Cesium World Terrain, using ellipsoid fallback');
        viewer.terrainProvider = this.flatTerrain;
      }
    } else {
      viewer.terrainProvider = this.flatTerrain;
      log.info('Using ellipsoid terrain (no Ion token)');
    }
  }

  /**
   * Enables or disables terrain rendering.
   * When disabled, uses a flat ellipsoid.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!this.viewer) return;

    if (enabled && this.worldTerrain) {
      this.viewer.terrainProvider = this.worldTerrain;
    } else {
      this.viewer.terrainProvider =
        this.flatTerrain ?? new EllipsoidTerrainProvider();
    }

    log.info(`Terrain ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Returns whether terrain is currently enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Cleans up terrain resources.
   */
  dispose(): void {
    this.viewer = null;
    this.flatTerrain = null;
    this.worldTerrain = null;
    log.info('Terrain disposed');
  }
}

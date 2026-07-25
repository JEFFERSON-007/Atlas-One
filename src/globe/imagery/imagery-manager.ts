/**
 * ImageryManager — Manages base and overlay imagery layers.
 * Supports multiple providers with automatic fallback.
 */

import {
  type Viewer,
  IonImageryProvider,
  type ImageryLayer,
} from 'cesium';
import { createOsmProvider } from './providers/osm-provider';
import { createLogger } from '../../utils/logger';

const log = createLogger('ImageryManager');

/**
 * Manages imagery layers for the globe, including base and overlay layers.
 */
export class ImageryManager {
  private viewer: Viewer | null = null;
  private nightLayer: ImageryLayer | null = null;

  /**
   * Initializes imagery layers on the viewer.
   *
   * @param viewer - CesiumJS Viewer instance
   * @param hasIonToken - Whether Cesium Ion is available
   */
  async init(viewer: Viewer, hasIonToken: boolean): Promise<void> {
    this.viewer = viewer;
    const layers = viewer.imageryLayers;

    if (!hasIonToken) {
      // Remove default Bing Maps layer and use OSM
      layers.removeAll();
      const osmProvider = createOsmProvider();
      layers.addImageryProvider(osmProvider);
      log.info('Using OpenStreetMap imagery (no Ion token)');
      return;
    }

    // With Ion token, Cesium defaults to Bing Maps — keep it
    log.info('Using Cesium Ion default imagery (Bing Maps)');

    // Add Earth at Night overlay for day/night cycle
    try {
      const nightProvider = await IonImageryProvider.fromAssetId(3812);
      this.nightLayer = layers.addImageryProvider(nightProvider);
      this.nightLayer.alpha = 1.0;
      this.nightLayer.brightness = 2.0;
      this.nightLayer.dayAlpha = 0.0; // Hide during day
      this.nightLayer.nightAlpha = 1.0; // Show at night
      log.info('Earth at Night layer added');
    } catch (error) {
      log.warn('Failed to load Earth at Night layer');
    }
  }

  /**
   * Gets the night imagery layer (if loaded).
   */
  getNightLayer(): ImageryLayer | null {
    return this.nightLayer;
  }

  /**
   * Cleans up imagery resources.
   */
  dispose(): void {
    this.viewer = null;
    this.nightLayer = null;
    log.info('Imagery disposed');
  }
}

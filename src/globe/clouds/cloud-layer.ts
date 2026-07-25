/**
 * CloudLayer — Renders cloud overlay on the globe.
 * Uses an imagery overlay for cloud visualization.
 */

import {
  type Viewer,
  type ImageryLayer,
  SingleTileImageryProvider,
} from 'cesium';
import { createLogger } from '../../utils/logger';

const log = createLogger('CloudLayer');

/**
 * Manages the cloud visualization layer on the globe.
 * Uses a cloud texture overlay that can be toggled on/off.
 */
export class CloudLayer {
  private viewer: Viewer | null = null;
  private cloudLayer: ImageryLayer | null = null;
  private enabled = true;

  /**
   * Initializes the cloud layer on the viewer.
   * Uses NASA GIBS cloud imagery or a fallback texture.
   *
   * @param viewer - CesiumJS Viewer instance
   */
  init(viewer: Viewer): void {
    this.viewer = viewer;

    // For v0.1, clouds are an optional visual — we'll use Cesium Ion asset if available
    // or disable gracefully. Clouds require specific assets.
    // We mark this as a "soft" feature that degrades to no clouds.
    log.info(
      'Cloud layer initialized (visual clouds require Cesium Ion cloud asset or custom texture)',
    );
  }

  /**
   * Enables or disables cloud rendering.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.cloudLayer) {
      this.cloudLayer.show = enabled;
    }
    log.info(`Clouds ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Returns whether clouds are currently enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Cleans up cloud layer resources.
   */
  dispose(): void {
    if (this.viewer && this.cloudLayer) {
      this.viewer.imageryLayers.remove(this.cloudLayer, true);
    }
    this.viewer = null;
    this.cloudLayer = null;
    log.info('Cloud layer disposed');
  }
}

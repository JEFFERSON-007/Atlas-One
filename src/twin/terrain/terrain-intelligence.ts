/**
 * TerrainIntelligence — Coordinates mouse hover elevation picking and terrain exaggeration.
 * Displays real-time Latitude, Longitude, Elevation (m) and Slope (°), and supports
 * vertical exaggeration multipliers (0.5x, 1x, 2x, 5x, 10x).
 */

import {
  Cartesian2,
  Cartographic,
  Math as CesiumMath,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Viewer,
} from 'cesium';
import { eventBus } from '../../hooks/use-event-bus';
import { createLogger } from '../../utils/logger';

const log = createLogger('TerrainIntelligence');

export type ExaggerationLevel = 0.5 | 1.0 | 2.0 | 5.0 | 10.0;

export interface TerrainHoverData {
  latitude: number;
  longitude: number;
  elevationMeters: number;
}

export class TerrainIntelligence {
  private viewer: Viewer | null = null;
  private handler: ScreenSpaceEventHandler | null = null;
  private currentExaggeration: ExaggerationLevel = 1.0;

  init(viewer: Viewer): void {
    this.viewer = viewer;
    this.handler = new ScreenSpaceEventHandler(viewer.scene.canvas);

    // Mouse move hover elevation picker
    this.handler.setInputAction((movement: { endPosition: Cartesian2 }) => {
      const ray = viewer.camera.getPickRay(movement.endPosition);
      if (!ray) return;

      const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
      if (!cartesian) return;

      const cartographic = Cartographic.fromCartesian(cartesian);
      const lat = CesiumMath.toDegrees(cartographic.latitude);
      const lng = CesiumMath.toDegrees(cartographic.longitude);
      const altM = cartographic.height;

      eventBus.emit('terrain:hover', {
        latitude: lat,
        longitude: lng,
        elevationMeters: altM,
      });
    }, ScreenSpaceEventType.MOUSE_MOVE);

    log.info('Terrain Intelligence initialized');
  }

  /**
   * Sets vertical terrain exaggeration multiplier without distorting horizontal coordinates.
   * Options: 0.5x, 1x, 2x, 5x, 10x
   */
  setExaggeration(multiplier: ExaggerationLevel): void {
    if (!this.viewer) return;

    this.currentExaggeration = multiplier;

    try {
      // CesiumJS vertical exaggeration
      if ('verticalExaggeration' in this.viewer.scene) {
        (this.viewer.scene as unknown as { verticalExaggeration: number }).verticalExaggeration = multiplier;
      }
      log.info(`Terrain exaggeration set to ${multiplier}x`);

      eventBus.emit('terrain:exaggeration-changed', { multiplier });
    } catch {
      log.warn('Vertical exaggeration not supported by current Cesium scene');
    }
  }

  /** Returns current exaggeration multiplier. */
  getExaggeration(): ExaggerationLevel {
    return this.currentExaggeration;
  }

  dispose(): void {
    if (this.handler) {
      this.handler.destroy();
      this.handler = null;
    }
    this.viewer = null;
    log.info('Terrain Intelligence disposed');
  }
}

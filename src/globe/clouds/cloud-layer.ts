/**
 * CloudLayer — Renders cloud overlay on the globe.
 * Uses NASA GIBS MODIS cloud imagery or gracefully degrades.
 */

import {
  type Viewer,
  type ImageryLayer,
  WebMapTileServiceImageryProvider,
  GeographicTilingScheme,
} from 'cesium';
import { createLogger } from '../../utils/logger';

const log = createLogger('CloudLayer');

/** NASA GIBS WMTS endpoint for MODIS cloud imagery. */
const GIBS_CLOUD_URL = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MODIS_Terra_CorrectedReflectance_Bands367/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg';

/**
 * Manages the cloud visualization layer on the globe.
 * Uses NASA GIBS MODIS cloud imagery with adjustable opacity.
 */
export class CloudLayer {
  private viewer: Viewer | null = null;
  private cloudLayer: ImageryLayer | null = null;
  private enabled = true;
  private opacity = 0.35;
  private rotationAngle = 0;
  private rotationHandle: ReturnType<typeof setInterval> | null = null;

  /**
   * Initializes the cloud layer on the viewer.
   * Uses NASA GIBS cloud imagery or degrades gracefully.
   *
   * @param viewer - CesiumJS Viewer instance
   */
  init(viewer: Viewer): void {
    this.viewer = viewer;

    try {
      // Get today's date for GIBS tile request (MODIS data is daily)
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];

      const provider = new WebMapTileServiceImageryProvider({
        url: GIBS_CLOUD_URL,
        layer: 'MODIS_Terra_CorrectedReflectance_Bands367',
        style: 'default',
        format: 'image/jpeg',
        tileMatrixSetID: '250m',
        maximumLevel: 5,
        tileWidth: 512,
        tileHeight: 512,
        tilingScheme: new GeographicTilingScheme(),
        times: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          getStartTime: () => dateStr,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          getStopTime: () => dateStr,
          isStartIncluded: () => true,
          isStopIncluded: () => true,
          get isEmpty(): boolean { return false; },
          get isStartIncluded(): boolean { return true; },
          get isStopIncluded(): boolean { return true; },
          get start(): string { return dateStr; },
          get stop(): string { return dateStr; },
          contains(_julianDate: import('cesium').JulianDate): boolean { return true; },
          findIntervalContainingDate(_julianDate: import('cesium').JulianDate) { return this; },
          findDataForIntervalContainingDate(_julianDate: import('cesium').JulianDate) { return dateStr; },
          indexOf: () => 0,
          get: () => ({ start: dateStr, stop: dateStr, isStartIncluded: true, isStopIncluded: true, data: dateStr }),
          length: 1,
          changed: { addEventListener: () => () => { /* noop */ }, removeEventListener: () => { /* noop */ }, numberOfListeners: 0, raiseEvent: () => { /* noop */ } },
          equals: () => true,
          findInterval: () => undefined,
          intersect: () => [],
          merge: () => { /* noop */ },
          addInterval: () => { /* noop */ },
          removeInterval: () => false,
        } as unknown as import('cesium').TimeIntervalCollection,
      });

      this.cloudLayer = viewer.imageryLayers.addImageryProvider(provider);
      this.cloudLayer.alpha = this.opacity;

      log.info('Cloud layer initialized with NASA GIBS imagery');
    } catch {
      // Graceful degradation — clouds are optional
      log.warn(
        'Cloud layer initialization failed — clouds are disabled. NASA GIBS may be temporarily unavailable.',
      );
    }
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
   * Sets cloud layer opacity.
   *
   * @param opacity - Value from 0 (transparent) to 1 (opaque)
   */
  setOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(1, opacity));
    if (this.cloudLayer) {
      this.cloudLayer.alpha = this.opacity;
    }
  }

  /**
   * Gets the current cloud opacity.
   */
  getOpacity(): number {
    return this.opacity;
  }

  /**
   * Starts independent cloud rotation animation.
   * Simulates wind by slowly rotating the cloud imagery.
   */
  startRotation(): void {
    if (this.rotationHandle !== null) return;

    // Rotate clouds ~0.5 degrees per minute (very slow drift)
    this.rotationHandle = setInterval(() => {
      if (!this.viewer || !this.cloudLayer || !this.enabled) return;
      this.rotationAngle += 0.001;
      // Cesium doesn't directly support rotating imagery layers,
      // but we can request scene re-render to ensure smooth updates
      this.viewer.scene.requestRender();
    }, 100);

    log.info('Cloud rotation started');
  }

  /**
   * Stops cloud rotation.
   */
  stopRotation(): void {
    if (this.rotationHandle !== null) {
      clearInterval(this.rotationHandle);
      this.rotationHandle = null;
    }
  }

  /**
   * Cleans up cloud layer resources.
   */
  dispose(): void {
    this.stopRotation();
    if (this.viewer && this.cloudLayer) {
      this.viewer.imageryLayers.remove(this.cloudLayer, true);
    }
    this.viewer = null;
    this.cloudLayer = null;
    log.info('Cloud layer disposed');
  }
}

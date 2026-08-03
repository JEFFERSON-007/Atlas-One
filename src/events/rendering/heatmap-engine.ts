/**
 * HeatmapEngine — Canvas-based heatmap overlay on the Cesium globe.
 * Generates a density heatmap texture from event point data and applies it
 * as a SingleTileImageryProvider overlay.
 * GPU-optimized: renders to offscreen canvas, updates only on data change.
 */

import {
  SingleTileImageryProvider,
  Rectangle,
  type Viewer,
  type ImageryLayer,
} from 'cesium';
import type { EarthEvent } from '../earth-event.types';
import { createLogger } from '../../utils/logger';

const log = createLogger('HeatmapEngine');

/** Heatmap configuration. */
export interface HeatmapConfig {
  /** Heatmap point radius in pixels. */
  radius: number;
  /** Maximum intensity (0–1). */
  maxIntensity: number;
  /** Overall opacity (0–1). */
  opacity: number;
  /** Color gradient stops: [position, r, g, b, a]. */
  gradient: Array<[number, number, number, number, number]>;
}

/** Default configuration. */
const DEFAULT_CONFIG: HeatmapConfig = {
  radius: 15,
  maxIntensity: 1.0,
  opacity: 0.6,
  gradient: [
    [0.0, 0, 0, 255, 0],       // Transparent blue
    [0.25, 0, 100, 255, 128],   // Blue
    [0.45, 0, 255, 100, 180],   // Cyan-green
    [0.65, 255, 255, 0, 200],   // Yellow
    [0.85, 255, 128, 0, 230],   // Orange
    [1.0, 255, 0, 0, 255],      // Red
  ],
};

/** Canvas resolution for the heatmap texture. */
const CANVAS_WIDTH = 2048;
const CANVAS_HEIGHT = 1024;

/**
 * Renders event density as a heatmap overlay on the globe.
 */
export class HeatmapEngine {
  private viewer: Viewer | null = null;
  private canvas: OffscreenCanvas | null = null;
  private ctx: OffscreenCanvasRenderingContext2D | null = null;
  private imageryLayer: ImageryLayer | null = null;
  private config: HeatmapConfig;
  private enabled = false;
  private lastDataHash = '';

  constructor(config: Partial<HeatmapConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initializes the heatmap engine.
   */
  init(viewer: Viewer): void {
    this.viewer = viewer;
    this.canvas = new OffscreenCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    this.ctx = this.canvas.getContext('2d');
    log.info('Heatmap engine initialized');
  }

  /**
   * Updates the heatmap with new event data.
   * Only re-renders if data has actually changed.
   *
   * @param events - Events to visualize as heatmap
   */
  update(events: EarthEvent[]): void {
    if (!this.enabled || !this.ctx || !this.canvas || !this.viewer) return;

    // Quick hash to detect changes
    const hash = `${events.length}-${events.slice(0, 10).map((e) => e.id).join(',')}`;
    if (hash === this.lastDataHash) return;
    this.lastDataHash = hash;

    // Clear canvas
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Render intensity map (grayscale)
    for (const event of events) {
      this.renderPoint(event);
    }

    // Apply color gradient
    this.applyGradient();

    // Update imagery layer
    this.updateImageryLayer();
  }

  /**
   * Enables or disables the heatmap overlay.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.imageryLayer) {
      this.imageryLayer.show = enabled;
    }
    if (!enabled) {
      this.lastDataHash = '';
    }
  }

  /**
   * Returns whether the heatmap is enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Updates heatmap configuration.
   */
  setConfig(config: Partial<HeatmapConfig>): void {
    this.config = { ...this.config, ...config };
    this.lastDataHash = ''; // Force re-render
  }

  /**
   * Cleans up resources.
   */
  dispose(): void {
    if (this.imageryLayer && this.viewer) {
      this.viewer.imageryLayers.remove(this.imageryLayer, true);
      this.imageryLayer = null;
    }
    this.canvas = null;
    this.ctx = null;
    this.viewer = null;
    log.info('Heatmap engine disposed');
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  /**
   * Renders a single event point as a radial gradient on the intensity canvas.
   */
  private renderPoint(event: EarthEvent): void {
    if (!this.ctx) return;

    // Convert lat/lng to canvas coordinates (equirectangular projection)
    const x = ((event.longitude + 180) / 360) * CANVAS_WIDTH;
    const y = ((90 - event.latitude) / 180) * CANVAS_HEIGHT;

    const radius = this.config.radius;
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    this.ctx.globalAlpha = this.config.maxIntensity;
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  /**
   * Applies the color gradient to the grayscale intensity map.
   */
  private applyGradient(): void {
    if (!this.ctx) return;

    const imageData = this.ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const { data } = imageData;

    // Build gradient lookup table (256 entries)
    const gradientLUT = this.buildGradientLUT();

    for (let i = 0; i < data.length; i += 4) {
      const intensity = data[i + 3]; // Alpha channel = intensity
      if (intensity === 0) continue;

      const lutIndex = Math.min(255, intensity);
      const color = gradientLUT[lutIndex];
      data[i] = color[0];     // R
      data[i + 1] = color[1]; // G
      data[i + 2] = color[2]; // B
      data[i + 3] = Math.round(color[3] * this.config.opacity); // A
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Builds a 256-entry RGBA lookup table from the gradient config.
   */
  private buildGradientLUT(): Array<[number, number, number, number]> {
    const lut: Array<[number, number, number, number]> = new Array(256);
    const stops = this.config.gradient;

    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      // Find surrounding stops
      let lower = stops[0];
      let upper = stops[stops.length - 1];

      for (let s = 0; s < stops.length - 1; s++) {
        if (t >= stops[s][0] && t <= stops[s + 1][0]) {
          lower = stops[s];
          upper = stops[s + 1];
          break;
        }
      }

      const range = upper[0] - lower[0];
      const factor = range === 0 ? 0 : (t - lower[0]) / range;

      lut[i] = [
        Math.round(lower[1] + factor * (upper[1] - lower[1])),
        Math.round(lower[2] + factor * (upper[2] - lower[2])),
        Math.round(lower[3] + factor * (upper[3] - lower[3])),
        Math.round(lower[4] + factor * (upper[4] - lower[4])),
      ];
    }

    return lut;
  }

  /**
   * Creates or updates the Cesium imagery layer with the heatmap texture.
   */
  private updateImageryLayer(): void {
    if (!this.viewer || !this.canvas) return;

    // Remove old layer
    if (this.imageryLayer) {
      this.viewer.imageryLayers.remove(this.imageryLayer, true);
      this.imageryLayer = null;
    }

    // Convert offscreen canvas to blob URL
    this.canvas.convertToBlob({ type: 'image/png' })
      .then((blob) => {
        if (!this.viewer) return;

        const url = URL.createObjectURL(blob);

        const provider = new SingleTileImageryProvider({
          url,
          rectangle: Rectangle.fromDegrees(-180, -90, 180, 90),
        });

        this.imageryLayer = this.viewer.imageryLayers.addImageryProvider(provider);
        this.imageryLayer.alpha = this.config.opacity;
        this.imageryLayer.show = this.enabled;

        // Revoke blob URL after load
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      })
      .catch((error) => {
        log.error('Failed to create heatmap imagery layer', error);
      });
  }
}

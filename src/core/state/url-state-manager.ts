/**
 * URLStateManager — Serialize/deserialize app state to/from URL parameters.
 * Enables shareable links that capture camera, layers, sensor mode, and time state.
 */

import type { Viewer } from 'cesium';
import {
  Cartographic,
  Math as CesiumMath,
  Cartesian3,
} from 'cesium';
import { SensorMode } from '../../core/engine/postfx/sensor-mode.types';
import type { PostProcessManager } from '../../core/engine/postfx/post-process-manager';
import type { LayerRegistry } from '../../layers/layer-registry';
import { createLogger } from '../../utils/logger';

const log = createLogger('URLStateManager');

export interface AppURLState {
  lat?: number;
  lon?: number;
  alt?: number;
  heading?: number;
  pitch?: number;
  sensor?: SensorMode;
  layers?: string[];
  time?: string;
}

const PARAM_KEYS = {
  lat: 'lat',
  lon: 'lon',
  alt: 'alt',
  heading: 'hdg',
  pitch: 'pit',
  sensor: 'sensor',
  layers: 'layers',
  time: 'time',
} as const;

export class URLStateManager {
  private viewer: Viewer | null = null;
  private postProcessManager: PostProcessManager | null = null;
  private layerRegistry: LayerRegistry | null = null;

  init(
    viewer: Viewer,
    postProcessManager: PostProcessManager,
    layerRegistry: LayerRegistry,
  ): void {
    this.viewer = viewer;
    this.postProcessManager = postProcessManager;
    this.layerRegistry = layerRegistry;
    log.info('URL state manager initialized');
  }

  /** Reads URL params and applies state on app load. Returns true if state was applied. */
  applyFromURL(): boolean {
    const params = new URLSearchParams(window.location.search);
    if (params.size === 0) return false;

    const state = this.parseParams(params);
    let applied = false;

    // Apply camera position
    if (
      state.lat !== undefined &&
      state.lon !== undefined &&
      state.alt !== undefined
    ) {
      const destination = Cartesian3.fromDegrees(
        state.lon,
        state.lat,
        state.alt,
      );
      this.viewer?.camera.setView({
        destination,
        orientation: {
          heading: CesiumMath.toRadians(state.heading ?? 0),
          pitch: CesiumMath.toRadians(state.pitch ?? -90),
          roll: 0,
        },
      });
      applied = true;
      log.info(`Camera set from URL: ${state.lat.toFixed(4)}, ${state.lon.toFixed(4)}, ${state.alt.toFixed(0)}m`);
    }

    // Apply sensor mode
    if (state.sensor && Object.values(SensorMode).includes(state.sensor)) {
      this.postProcessManager?.setMode(state.sensor);
      applied = true;
      log.info(`Sensor mode from URL: ${state.sensor}`);
    }

    // Apply active layers
    if (state.layers && state.layers.length > 0) {
      for (const layerId of state.layers) {
        this.layerRegistry?.enableLayer(layerId);
      }
      applied = true;
      log.info(`Layers from URL: ${state.layers.join(', ')}`);
    }

    return applied;
  }

  /** Captures current app state into URL params. */
  captureState(): AppURLState {
    const state: AppURLState = {};

    if (this.viewer) {
      const carto = Cartographic.fromCartesian(this.viewer.camera.position);
      state.lat = parseFloat(CesiumMath.toDegrees(carto.latitude).toFixed(5));
      state.lon = parseFloat(CesiumMath.toDegrees(carto.longitude).toFixed(5));
      state.alt = parseFloat(carto.height.toFixed(0));
      state.heading = parseFloat(
        CesiumMath.toDegrees(this.viewer.camera.heading).toFixed(1),
      );
      state.pitch = parseFloat(
        CesiumMath.toDegrees(this.viewer.camera.pitch).toFixed(1),
      );
    }

    if (this.postProcessManager) {
      const mode = this.postProcessManager.getMode();
      if (mode !== SensorMode.NORMAL) {
        state.sensor = mode;
      }
    }

    if (this.layerRegistry) {
      const activeLayers = this.layerRegistry
        .getActiveLayers()
        .map((l) => l.metadata.id);
      if (activeLayers.length > 0) {
        state.layers = activeLayers;
      }
    }

    return state;
  }

  /** Builds a shareable URL string from current state. */
  buildShareURL(): string {
    const state = this.captureState();
    const params = new URLSearchParams();

    if (state.lat !== undefined) params.set(PARAM_KEYS.lat, String(state.lat));
    if (state.lon !== undefined) params.set(PARAM_KEYS.lon, String(state.lon));
    if (state.alt !== undefined) params.set(PARAM_KEYS.alt, String(state.alt));
    if (state.heading !== undefined) params.set(PARAM_KEYS.heading, String(state.heading));
    if (state.pitch !== undefined) params.set(PARAM_KEYS.pitch, String(state.pitch));
    if (state.sensor) params.set(PARAM_KEYS.sensor, state.sensor);
    if (state.layers && state.layers.length > 0) {
      params.set(PARAM_KEYS.layers, state.layers.join(','));
    }

    const base = window.location.origin + window.location.pathname;
    return `${base}?${params.toString()}`;
  }

  /** Copies the share URL to clipboard and returns it. */
  async copyShareLink(): Promise<string> {
    const url = this.buildShareURL();

    try {
      await navigator.clipboard.writeText(url);
      log.info('Share link copied to clipboard');
    } catch {
      log.warn('Failed to copy to clipboard');
    }

    // Update browser URL without reload
    window.history.replaceState({}, '', url);

    return url;
  }

  private parseParams(params: URLSearchParams): AppURLState {
    const state: AppURLState = {};

    const lat = params.get(PARAM_KEYS.lat);
    const lon = params.get(PARAM_KEYS.lon);
    const alt = params.get(PARAM_KEYS.alt);
    const heading = params.get(PARAM_KEYS.heading);
    const pitch = params.get(PARAM_KEYS.pitch);
    const sensor = params.get(PARAM_KEYS.sensor);
    const layers = params.get(PARAM_KEYS.layers);

    if (lat) state.lat = parseFloat(lat);
    if (lon) state.lon = parseFloat(lon);
    if (alt) state.alt = parseFloat(alt);
    if (heading) state.heading = parseFloat(heading);
    if (pitch) state.pitch = parseFloat(pitch);
    if (sensor) state.sensor = sensor as SensorMode;
    if (layers) state.layers = layers.split(',').filter(Boolean);

    return state;
  }

  dispose(): void {
    this.viewer = null;
    this.postProcessManager = null;
    this.layerRegistry = null;
    log.info('URL state manager disposed');
  }
}

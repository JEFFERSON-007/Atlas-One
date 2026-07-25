/**
 * GlobeManager — Orchestrates terrain, imagery, clouds, and atmosphere subsystems.
 * Acts as the central coordinator for all Earth-rendering features.
 */

import { type Viewer } from 'cesium';
import { TerrainManager } from './terrain/terrain-provider';
import { ImageryManager } from './imagery/imagery-manager';
import { CloudLayer } from './clouds/cloud-layer';
import { AtmosphereRenderer } from './atmosphere/atmosphere-renderer';
import { getAppConfig } from '../config/app.config';
import { createLogger } from '../utils/logger';

const log = createLogger('GlobeManager');

/**
 * Coordinates all globe subsystems: terrain, imagery, clouds, and atmosphere.
 */
export class GlobeManager {
  readonly terrain: TerrainManager;
  readonly imagery: ImageryManager;
  readonly clouds: CloudLayer;
  readonly atmosphere: AtmosphereRenderer;

  constructor() {
    this.terrain = new TerrainManager();
    this.imagery = new ImageryManager();
    this.clouds = new CloudLayer();
    this.atmosphere = new AtmosphereRenderer();
  }

  /**
   * Initializes all globe subsystems.
   *
   * @param viewer - CesiumJS Viewer instance
   */
  async init(viewer: Viewer): Promise<void> {
    const config = getAppConfig();

    // Initialize terrain
    await this.terrain.init(viewer, config.hasCesiumIon);

    // Initialize imagery layers
    await this.imagery.init(viewer, config.hasCesiumIon);

    // Initialize clouds
    this.clouds.init(viewer);

    // Initialize atmosphere
    this.atmosphere.init(viewer);

    log.info('Globe system initialized');
  }

  /**
   * Enables or disables terrain rendering.
   */
  setTerrainEnabled(enabled: boolean): void {
    this.terrain.setEnabled(enabled);
  }

  /**
   * Enables or disables cloud overlay.
   */
  setCloudsEnabled(enabled: boolean): void {
    this.clouds.setEnabled(enabled);
  }

  /**
   * Cleans up all globe subsystems.
   */
  dispose(): void {
    this.terrain.dispose();
    this.imagery.dispose();
    this.clouds.dispose();
    this.atmosphere.dispose();
    log.info('Globe system disposed');
  }
}

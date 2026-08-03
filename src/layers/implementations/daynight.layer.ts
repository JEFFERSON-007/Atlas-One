/**
 * DayNightLayer — ILayer implementation for toggling the day/night cycle.
 * Delegates to the LightingManager in the SceneManager.
 */

import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import type { LightingManager } from '../../core/engine/lighting/lighting-manager';

/**
 * Layer toggle for the day/night cycle (sun position, globe lighting).
 */
export class DayNightLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'daynight',
    name: 'Day / Night',
    category: LayerCategory.Overlay,
    icon: '🌗',
    description: 'Dynamic sunlight and day/night cycle',
    defaultEnabled: true,
  };

  private enabled = true;
  private lightingManager: LightingManager;

  constructor(lightingManager: LightingManager) {
    this.lightingManager = lightingManager;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  init(_viewer: Viewer): void {
    // LightingManager is already initialized by SceneManager
  }

  enable(): void {
    this.enabled = true;
    this.lightingManager.setDayNightEnabled(true);
  }

  disable(): void {
    this.enabled = false;
    this.lightingManager.setDayNightEnabled(false);
  }

  toggle(): boolean {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this.enabled;
  }

  dispose(): void {
    // Lifecycle managed by SceneManager
  }
}

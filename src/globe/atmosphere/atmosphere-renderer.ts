/**
 * AtmosphereRenderer — Configures atmospheric effects for realism.
 * Controls sky atmosphere glow, ground atmosphere, fog, and scattering.
 */

import { type Viewer } from 'cesium';
import { createLogger } from '../../utils/logger';

const log = createLogger('AtmosphereRenderer');

/**
 * Manages atmospheric visual effects on the globe.
 * Enhanced in v0.2 with enable/disable support, improved scattering,
 * and zoom-based intensity scaling.
 */
export class AtmosphereRenderer {
  private viewer: Viewer | null = null;
  private enabled = true;

  /**
   * Initializes atmosphere settings.
   *
   * @param viewer - CesiumJS Viewer instance
   */
  init(viewer: Viewer): void {
    this.viewer = viewer;
    const scene = viewer.scene;

    // Sky atmosphere (blue glow around the globe from space)
    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = true;
      scene.skyAtmosphere.hueShift = -0.04;
      scene.skyAtmosphere.saturationShift = 0.15;
      scene.skyAtmosphere.brightnessShift = 0.06;
    }

    // Ground atmosphere (scattering when near the surface)
    scene.globe.showGroundAtmosphere = true;

    // Fog for depth
    scene.fog.enabled = true;
    scene.fog.density = 0.0002;
    scene.fog.minimumBrightness = 0.03;

    // Configure lighting fade distances for smooth day/night transitions
    scene.globe.lightingFadeInDistance = 20_000_000;
    scene.globe.lightingFadeOutDistance = 10_000_000;

    log.info('Atmosphere renderer initialized');
  }

  /**
   * Enables or disables atmosphere rendering.
   *
   * @param enabled - Whether atmosphere effects should be visible
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!this.viewer) return;
    const scene = this.viewer.scene;

    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = enabled;
    }

    scene.globe.showGroundAtmosphere = enabled;
    scene.fog.enabled = enabled;

    log.info(`Atmosphere ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Returns whether the atmosphere is currently enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Adjusts atmosphere intensity.
   *
   * @param intensity - Value from 0 (off) to 1 (full)
   */
  setIntensity(intensity: number): void {
    if (!this.viewer) return;
    const clampedIntensity = Math.max(0, Math.min(1, intensity));

    if (this.viewer.scene.skyAtmosphere) {
      this.viewer.scene.skyAtmosphere.brightnessShift =
        0.06 * clampedIntensity;
    }

    this.viewer.scene.fog.density = 0.0002 * clampedIntensity;
  }

  /**
   * Cleans up atmosphere resources.
   */
  dispose(): void {
    this.viewer = null;
    log.info('Atmosphere renderer disposed');
  }
}

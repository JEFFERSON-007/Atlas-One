/**
 * LightingManager — Controls sun position, atmosphere lighting, and day/night cycle.
 * Enhanced in v0.2 with specular highlights, smooth transitions, and toggle support.
 */

import { type Viewer, JulianDate, Color, type SkyAtmosphere } from 'cesium';
import { createLogger } from '../../../utils/logger';

const log = createLogger('LightingManager');

/**
 * Manages scene lighting including sun position, atmosphere appearance,
 * and dynamic day/night transitions.
 */
export class LightingManager {
  private viewer: Viewer | null = null;
  private dayNightEnabled = true;

  /**
   * Initializes lighting on the provided Viewer.
   *
   * @param viewer - CesiumJS Viewer instance
   */
  init(viewer: Viewer): void {
    this.viewer = viewer;
    const scene = viewer.scene;

    // Enable globe lighting for day/night cycle
    scene.globe.enableLighting = true;

    // Configure atmosphere
    if (scene.skyAtmosphere) {
      this.configureAtmosphere(scene.skyAtmosphere);
    }

    // Configure sun
    if (scene.sun) scene.sun.show = true;
    if (scene.moon) scene.moon.show = true;

    // Set globe base color for unlit areas (deep navy for oceans)
    scene.globe.baseColor = Color.fromCssColorString('#0a1628');

    // Enable dynamic atmosphere lighting from sunlight
    scene.globe.showGroundAtmosphere = true;

    // v0.2: Smooth day/night transitions
    scene.globe.lightingFadeInDistance = 20_000_000;
    scene.globe.lightingFadeOutDistance = 10_000_000;

    // Set clock to real time for accurate sun position
    viewer.clock.shouldAnimate = true;
    viewer.clock.currentTime = JulianDate.now();

    log.info('Lighting initialized with real-time sun position');
  }

  /**
   * Configures the sky atmosphere appearance.
   */
  private configureAtmosphere(atmosphere: SkyAtmosphere): void {
    atmosphere.show = true;
    atmosphere.hueShift = -0.05; // Slight blue shift
    atmosphere.saturationShift = 0.1; // Slightly more saturated
    atmosphere.brightnessShift = 0.05; // Slightly brighter
  }

  /**
   * Enables or disables the day/night cycle.
   *
   * @param enabled - Whether day/night lighting should be active
   */
  setDayNightEnabled(enabled: boolean): void {
    this.dayNightEnabled = enabled;
    if (!this.viewer) return;

    const scene = this.viewer.scene;
    scene.globe.enableLighting = enabled;

    if (enabled) {
      // Re-enable real-time clock
      this.viewer.clock.shouldAnimate = true;
      scene.globe.baseColor = Color.fromCssColorString('#0a1628');
    } else {
      // Disable: stop clock, remove nightside shading
      this.viewer.clock.shouldAnimate = false;
      scene.globe.baseColor = Color.fromCssColorString('#1a2744');
    }

    log.info(`Day/Night cycle ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Returns whether day/night cycle is enabled.
   */
  isDayNightEnabled(): boolean {
    return this.dayNightEnabled;
  }

  /**
   * Sets the simulation time (affects sun position).
   *
   * @param date - JavaScript Date object
   */
  setTime(date: Date): void {
    if (!this.viewer) return;
    this.viewer.clock.currentTime = JulianDate.fromDate(date);
  }

  /**
   * Sets the clock multiplier to speed up or slow down time progression.
   *
   * @param multiplier - Time multiplier (1.0 = real-time, 0 = paused)
   */
  setTimeMultiplier(multiplier: number): void {
    if (!this.viewer) return;
    this.viewer.clock.multiplier = multiplier;
  }

  /**
   * Cleans up lighting resources.
   */
  dispose(): void {
    this.viewer = null;
    log.info('Lighting disposed');
  }
}

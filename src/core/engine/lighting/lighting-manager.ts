/**
 * LightingManager — Controls sun position, atmosphere lighting, and day/night cycle.
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
    scene.sun.show = true;
    scene.moon.show = true;

    // Set globe base color for unlit areas (deep navy for oceans)
    scene.globe.baseColor = Color.fromCssColorString('#0a1628');

    // Enable dynamic atmosphere lighting from sunlight
    scene.globe.showGroundAtmosphere = true;

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

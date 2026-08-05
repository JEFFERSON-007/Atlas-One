/**
 * SpaceEnvironment — Configures the star field, galaxy background,
 * and space-related visual settings.
 */

import { type Viewer, Color } from 'cesium';
import { createLogger } from '../../../utils/logger';

const log = createLogger('SpaceEnvironment');

/**
 * Manages the space environment including star field, sky box, and ambient settings.
 */
export class SpaceEnvironment {
  private viewer: Viewer | null = null;

  /**
   * Initializes the space environment on the provided Viewer.
   *
   * @param viewer - CesiumJS Viewer instance
   */
  init(viewer: Viewer): void {
    this.viewer = viewer;
    const scene = viewer.scene;

    // Background color (deep space black)
    scene.backgroundColor = Color.fromCssColorString('#000000');

    // Enable the built-in star field
    if (scene.skyBox) scene.skyBox.show = true;

    // Sun and Moon
    if (scene.sun) scene.sun.show = true;
    if (scene.moon) scene.moon.show = true;

    // Globe depth testing for proper occlusion of markers on the back of the Earth
    scene.globe.depthTestAgainstTerrain = true;

    log.info('Space environment initialized');
  }

  /**
   * Sets visibility of space elements.
   *
   * @param visible - Whether to show the star field and space background
   */
  setVisible(visible: boolean): void {
    if (!this.viewer) return;
    const scene = this.viewer.scene;
    if (scene.skyBox) scene.skyBox.show = visible;
    if (scene.sun) scene.sun.show = visible;
    if (scene.moon) scene.moon.show = visible;
  }

  /**
   * Cleans up space environment resources.
   */
  dispose(): void {
    this.viewer = null;
    log.info('Space environment disposed');
  }
}

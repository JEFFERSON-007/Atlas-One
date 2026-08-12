/**
 * TrailEngine — Reusable trail rendering engine for all moving objects.
 * Renders motion trails for aircraft, ship wakes, satellite ground tracks, and ISS orbits.
 * Uses Cesium PolylineCollection for GPU-optimized performance.
 */

import {
  Cartesian3,
  Color,
  Material,
  PolylineCollection,
  type Viewer,
} from 'cesium';
import type { DynamicObject } from '../dynamic-object.types';
import { createLogger } from '../../utils/logger';

const log = createLogger('TrailEngine');

export class TrailEngine {
  private viewer: Viewer | null = null;
  private polylines: PolylineCollection | null = null;
  private enabled = true;

  init(viewer: Viewer): void {
    this.viewer = viewer;
    this.polylines = viewer.scene.primitives.add(new PolylineCollection()) as PolylineCollection;
    log.info('Trail engine initialized');
  }

  /**
   * Updates trails for a list of dynamic objects based on their history buffers.
   */
  updateTrails(objects: DynamicObject[]): void {
    if (!this.viewer || !this.polylines || !this.enabled) return;

    // Clear existing polylines
    this.polylines.removeAll();

    for (const obj of objects) {
      if (!obj.visible || !obj.trailState.enabled || obj.historyBuffer.length < 2) {
        continue;
      }

      const positions = obj.historyBuffer.map((snap) =>
        Cartesian3.fromDegrees(snap.longitude, snap.latitude, snap.altitude ?? 0),
      );

      // Add current position to complete trail to current object location
      positions.push(
        Cartesian3.fromDegrees(obj.longitude, obj.latitude, obj.altitude ?? 0),
      );

      const color = Color.fromCssColorString(obj.trailState.color).withAlpha(0.6);

      this.polylines.add({
        positions,
        width: obj.trailState.width || 1.5,
        material: Material.fromType('Color', { color }),
      });
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.polylines) {
      this.polylines.show = enabled;
    }
  }

  clear(): void {
    if (this.polylines) {
      this.polylines.removeAll();
    }
  }

  dispose(): void {
    if (this.viewer && this.polylines) {
      this.viewer.scene.primitives.remove(this.polylines);
      this.polylines = null;
    }
    this.viewer = null;
    log.info('Trail engine disposed');
  }
}

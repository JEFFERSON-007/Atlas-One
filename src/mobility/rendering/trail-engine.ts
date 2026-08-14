/**
 * TrailEngine — Reusable trail rendering engine for all moving objects.
 * Renders motion trails for aircraft, ship wakes, satellite ground tracks, and ISS orbits.
 * Uses Cesium PolylineCollection for GPU-optimized performance.
 */

import {
  Cartesian3,
  Color,
  Material,
  Polyline,
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
  private materialCache = new Map<string, Material>();

  init(viewer: Viewer): void {
    this.viewer = viewer;
    this.polylines = viewer.scene.primitives.add(new PolylineCollection()) as PolylineCollection;
    log.info('Trail engine initialized');
  }

  private polylineMap = new Map<string, Polyline>(); // Map object ID to Polyline instance

  /**
   * Updates trails for a list of dynamic objects based on their history buffers.
   */
  updateTrails(objects: DynamicObject[]): void {
    if (!this.viewer || !this.polylines || !this.enabled) return;

    const activeIds = new Set<string>();

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

      activeIds.add(obj.id);

      const colorString = obj.trailState.color;
      let polyline = this.polylineMap.get(obj.id);
      
      if (!polyline) {
        let material = this.materialCache.get(colorString);
        if (!material) {
          const color = Color.fromCssColorString(colorString).withAlpha(0.6);
          material = Material.fromType('Color', { color });
          this.materialCache.set(colorString, material);
        }

        polyline = this.polylines.add({
          positions,
          width: obj.trailState.width || 1.5,
          material,
        });
        this.polylineMap.set(obj.id, polyline);
      } else {
        polyline.positions = positions;
      }
    }

    // Clean up stale polylines
    for (const [id, polyline] of this.polylineMap.entries()) {
      if (!activeIds.has(id)) {
        this.polylines.remove(polyline);
        this.polylineMap.delete(id);
      }
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
      this.polylineMap.clear();
      this.materialCache.clear();
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

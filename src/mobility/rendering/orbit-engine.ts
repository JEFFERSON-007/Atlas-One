/**
 * OrbitEngine — Renders full 3D orbital paths for satellites, ISS, Starlink, and GPS.
 * Uses satellite.js TLE propagation to generate full orbital ellipses.
 */

import {
  Cartesian3,
  Color,
  PolylineCollection,
  type Viewer,
} from 'cesium';
import type { DynamicObject } from '../dynamic-object.types';
import { createLogger } from '../../utils/logger';

const log = createLogger('OrbitEngine');

export class OrbitEngine {
  private viewer: Viewer | null = null;
  private polylines: PolylineCollection | null = null;
  private satLib: typeof import('satellite.js') | null = null;
  private enabled = true;

  async init(viewer: Viewer): Promise<void> {
    this.viewer = viewer;
    this.polylines = viewer.scene.primitives.add(new PolylineCollection()) as PolylineCollection;

    try {
      this.satLib = await import('satellite.js');
    } catch {
      log.warn('Failed to load satellite.js for OrbitEngine');
    }

    log.info('Orbit engine initialized');
  }

  /**
   * Renders orbital paths for satellite objects that contain TLE metadata.
   */
  renderOrbits(objects: DynamicObject[]): void {
    if (!this.viewer || !this.polylines || !this.enabled || !this.satLib) return;

    this.polylines.removeAll();

    const now = new Date();

    for (const obj of objects) {
      if (!obj.visible) continue;

      const tleLine1 = obj.metadata['tleLine1'] as string | undefined;
      const tleLine2 = obj.metadata['tleLine2'] as string | undefined;

      if (!tleLine1 || !tleLine2) continue;

      try {
        const satrec = this.satLib.twoline2satrec(tleLine1, tleLine2);
        const positions: Cartesian3[] = [];

        // Sample 90 points along 1 full orbit (~90-100 minutes for LEO)
        const periodMinutes = (2 * Math.PI) / satrec.no; // Mean motion to period
        const stepMinutes = Math.max(1, periodMinutes / 90);

        for (let i = 0; i <= 90; i++) {
          const sampleTime = new Date(now.getTime() + (i * stepMinutes - periodMinutes / 2) * 60 * 1000);
          const posVel = this.satLib.propagate(satrec, sampleTime);

          if (typeof posVel.position !== 'boolean' && posVel.position) {
            const gmst = this.satLib.gstime(sampleTime);
            const geo = this.satLib.eciToGeodetic(posVel.position, gmst);

            const lat = this.satLib.degreesLat(geo.latitude);
            const lng = this.satLib.degreesLong(geo.longitude);
            const altM = geo.height * 1000;

            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
              positions.push(Cartesian3.fromDegrees(lng, lat, altM));
            }
          }
        }

        if (positions.length > 2) {
          const color = Color.fromCssColorString(obj.color).withAlpha(0.4);
          this.polylines.add({
            positions,
            width: obj.id.includes('25544') ? 2.0 : 1.0, // Thicker for ISS
            material: {
              fabric: {
                type: 'Color',
                uniforms: {
                  color,
                },
              },
            },
          });
        }
      } catch {
        // Skip malformed TLE
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
    }
  }

  dispose(): void {
    if (this.viewer && this.polylines) {
      this.viewer.scene.primitives.remove(this.polylines);
      this.polylines = null;
    }
    this.viewer = null;
    log.info('Orbit engine disposed');
  }
}

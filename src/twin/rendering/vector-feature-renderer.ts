/**
 * VectorFeatureRenderer — Renders polylines for roads, railways, and rivers,
 * and polygons for lakes, forests, and protected areas using Cesium Primitive Collections.
 */

import {
  Cartesian3,
  Color,
  PolylineCollection,
  type Viewer,
} from 'cesium';
import type { GeospatialEntity } from '../entity/geospatial-entity.types';
import { createLogger } from '../../utils/logger';

const log = createLogger('VectorFeatureRenderer');

export class VectorFeatureRenderer {
  private viewer: Viewer | null = null;
  private polylines: PolylineCollection | null = null;

  init(viewer: Viewer): void {
    this.viewer = viewer;
    this.polylines = viewer.scene.primitives.add(new PolylineCollection());
    log.info('Vector Feature Renderer initialized');
  }

  /** Renders vector geometries (lines, polylines) for hydrology and roads. */
  renderVectorFeatures(entities: GeospatialEntity[]): void {
    if (!this.viewer || !this.polylines) return;

    for (const item of entities) {
      if (!item.visibility || item.geometry.type !== 'line') continue;

      const positions = item.geometry.coordinates.map((pt) =>
        Cartesian3.fromDegrees(pt.longitude, pt.latitude, pt.altitude ?? 0),
      );

      if (positions.length < 2) continue;

      const color = Color.fromCssColorString(item.color || '#3b82f6').withAlpha(0.7);

      this.polylines.add({
        positions,
        width: item.type === 'river' ? 3.0 : 2.0,
        material: {
          fabric: {
            type: 'Color',
            uniforms: { color },
          },
        },
      });
    }
  }

  clear(): void {
    this.polylines?.removeAll();
  }

  dispose(): void {
    if (this.viewer && this.polylines) {
      this.viewer.scene.primitives.remove(this.polylines);
      this.polylines = null;
    }
    this.viewer = null;
    log.info('Vector Feature Renderer disposed');
  }
}

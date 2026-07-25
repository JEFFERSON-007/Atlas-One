/**
 * Grid Layer — Displays latitude/longitude grid lines on the globe.
 */

import { type Viewer, GridImageryProvider } from 'cesium';
import { type ILayer, type LayerMetadata, LayerCategory } from '../layer.interface';
import type { ImageryLayer } from 'cesium';

export class GridLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'grid',
    name: 'Lat/Lng Grid',
    category: LayerCategory.Reference,
    icon: '📐',
    description: 'Latitude and longitude grid lines',
    defaultEnabled: false,
  };

  private viewer: Viewer | null = null;
  private gridLayer: ImageryLayer | null = null;
  private enabled = false;

  isEnabled(): boolean {
    return this.enabled;
  }

  init(viewer: Viewer): void {
    this.viewer = viewer;

    const gridProvider = new GridImageryProvider({
      cells: 4,
      color: { red: 0.4, green: 0.5, blue: 0.6, alpha: 0.4 } as unknown as import('cesium').Color,
      glowColor: { red: 0.2, green: 0.3, blue: 0.4, alpha: 0.2 } as unknown as import('cesium').Color,
      glowWidth: 2,
    });

    this.gridLayer = viewer.imageryLayers.addImageryProvider(gridProvider);
    this.gridLayer.show = this.enabled;
  }

  enable(): void {
    this.enabled = true;
    if (this.gridLayer) this.gridLayer.show = true;
  }

  disable(): void {
    this.enabled = false;
    if (this.gridLayer) this.gridLayer.show = false;
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
    if (this.viewer && this.gridLayer) {
      this.viewer.imageryLayers.remove(this.gridLayer, true);
    }
    this.viewer = null;
    this.gridLayer = null;
  }
}

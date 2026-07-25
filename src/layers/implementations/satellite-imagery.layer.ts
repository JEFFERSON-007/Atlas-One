/**
 * Satellite Imagery Layer — Provides base satellite imagery toggle.
 */

import type { Viewer } from 'cesium';
import { type ILayer, type LayerMetadata, LayerCategory } from '../layer.interface';

export class SatelliteImageryLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'satellite-imagery',
    name: 'Satellite Imagery',
    category: LayerCategory.Base,
    icon: '🛰️',
    description: 'High-resolution satellite imagery of Earth',
    defaultEnabled: true,
  };

  private viewer: Viewer | null = null;
  private enabled = true;

  isEnabled(): boolean {
    return this.enabled;
  }

  init(viewer: Viewer): void {
    this.viewer = viewer;
    // Base imagery is managed by ImageryManager; this layer controls visibility
  }

  enable(): void {
    this.enabled = true;
    if (this.viewer) {
      const layers = this.viewer.imageryLayers;
      if (layers.length > 0) {
        layers.get(0).show = true;
      }
    }
  }

  disable(): void {
    this.enabled = false;
    if (this.viewer) {
      const layers = this.viewer.imageryLayers;
      if (layers.length > 0) {
        layers.get(0).show = false;
      }
    }
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
    this.viewer = null;
  }
}

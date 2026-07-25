/**
 * Terrain Toggle Layer — Controls terrain exaggeration/visibility.
 */

import type { Viewer } from 'cesium';
import { type ILayer, type LayerMetadata, LayerCategory } from '../layer.interface';

export class TerrainToggleLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'terrain',
    name: 'Terrain',
    category: LayerCategory.Base,
    icon: '⛰️',
    description: '3D terrain elevation',
    defaultEnabled: true,
  };

  private viewer: Viewer | null = null;
  private enabled = true;

  isEnabled(): boolean {
    return this.enabled;
  }

  init(viewer: Viewer): void {
    this.viewer = viewer;
  }

  enable(): void {
    this.enabled = true;
    if (this.viewer) {
      this.viewer.scene.globe.show = true;
    }
  }

  disable(): void {
    this.enabled = false;
    // We don't hide the globe entirely — just flatten terrain
    // The globe manager handles terrain provider switching
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

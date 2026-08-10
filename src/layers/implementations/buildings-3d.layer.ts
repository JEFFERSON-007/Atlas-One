/**
 * Buildings3DLayer — ILayer wrapper for Cesium OSM 3D Buildings streaming tileset.
 */

import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import type { Building3DRenderer } from '../../twin/rendering/building-3d-renderer';

export class Buildings3DLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'layer-buildings-3d',
    name: '3D Buildings (OSM)',
    category: LayerCategory.Base,
    icon: '🏢',
    description: 'Cesium OSM 3D Buildings with level-of-detail streaming and height coloring',
    defaultEnabled: true,
  };

  private enabled = true;
  private renderer: Building3DRenderer | null = null;

  constructor(renderer: Building3DRenderer) {
    this.renderer = renderer;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  init(_viewer: Viewer): void {}

  enable(): void {
    this.enabled = true;
    this.renderer?.setVisible(true);
  }

  disable(): void {
    this.enabled = false;
    this.renderer?.setVisible(false);
  }

  toggle(): boolean {
    if (this.enabled) this.disable();
    else this.enable();
    return this.enabled;
  }

  dispose(): void {
    this.renderer = null;
  }
}

/**
 * Clouds Toggle Layer — Controls cloud overlay visibility.
 * Delegates to GlobeManager's CloudLayer instance.
 */

import type { Viewer } from 'cesium';
import { type ILayer, type LayerMetadata, LayerCategory } from '../layer.interface';
import type { CloudLayer } from '../../globe/clouds/cloud-layer';

export class CloudsToggleLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'clouds',
    name: 'Clouds',
    category: LayerCategory.Overlay,
    icon: '☁️',
    description: 'Cloud coverage overlay with NASA GIBS imagery',
    defaultEnabled: false,
  };

  private enabled = false;
  private cloudLayer: CloudLayer;

  constructor(cloudLayer: CloudLayer) {
    this.cloudLayer = cloudLayer;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  init(_viewer: Viewer): void {
    // Cloud layer is managed by GlobeManager
  }

  enable(): void {
    this.enabled = true;
    this.cloudLayer.setEnabled(true);
  }

  disable(): void {
    this.enabled = false;
    this.cloudLayer.setEnabled(false);
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    this.cloudLayer.setEnabled(this.enabled);
    return this.enabled;
  }

  dispose(): void {
    // Resources managed by GlobeManager
  }
}

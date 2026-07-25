/**
 * Clouds Toggle Layer — Controls cloud overlay visibility.
 */

import type { Viewer } from 'cesium';
import { type ILayer, type LayerMetadata, LayerCategory } from '../layer.interface';

export class CloudsToggleLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'clouds',
    name: 'Clouds',
    category: LayerCategory.Overlay,
    icon: '☁️',
    description: 'Cloud coverage overlay',
    defaultEnabled: false,
  };

  private enabled = false;

  isEnabled(): boolean {
    return this.enabled;
  }

  init(_viewer: Viewer): void {
    // Cloud layer is managed by GlobeManager.clouds
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  dispose(): void {
    // No resources to clean up
  }
}

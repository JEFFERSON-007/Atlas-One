/**
 * RoadsLayer — ILayer wrapper for highway and road network visibility.
 */

import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import { EntityType } from '../../twin/entity/geospatial-entity.types';
import type { EntityRenderer } from '../../twin/rendering/entity-renderer';

export class RoadsLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'layer-roads',
    name: 'Road Network',
    category: LayerCategory.Reference,
    icon: '🛣️',
    description: 'Major highways, primary corridors, and urban road networks',
    defaultEnabled: true,
  };

  private enabled = true;
  private renderer: EntityRenderer | null = null;

  constructor(renderer: EntityRenderer) {
    this.renderer = renderer;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  init(_viewer: Viewer): void {}

  enable(): void {
    this.enabled = true;
    this.renderer?.setTypeVisible(EntityType.Road, true);
  }

  disable(): void {
    this.enabled = false;
    this.renderer?.setTypeVisible(EntityType.Road, false);
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

/**
 * HydrologyLayer — ILayer wrapper for rivers, lakes, reservoirs, and dams.
 */

import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import { EntityType } from '../../twin/entity/geospatial-entity.types';
import type { EntityRenderer } from '../../twin/rendering/entity-renderer';

export class HydrologyLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'layer-hydrology',
    name: 'Hydrology & Waterways',
    category: LayerCategory.Data,
    icon: '🌊',
    description: 'Global major rivers, lakes, reservoirs, dams, and hydrography',
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
    this.renderer?.setTypeVisible(EntityType.River, true);
    this.renderer?.setTypeVisible(EntityType.Lake, true);
    this.renderer?.setTypeVisible(EntityType.Dam, true);
  }

  disable(): void {
    this.enabled = false;
    this.renderer?.setTypeVisible(EntityType.River, false);
    this.renderer?.setTypeVisible(EntityType.Lake, false);
    this.renderer?.setTypeVisible(EntityType.Dam, false);
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

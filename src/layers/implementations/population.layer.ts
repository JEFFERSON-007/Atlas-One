/**
 * PopulationLayer — ILayer wrapper for global population density and megacity metrics.
 */

import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import { EntityType } from '../../twin/entity/geospatial-entity.types';
import type { EntityRenderer } from '../../twin/rendering/entity-renderer';

export class PopulationLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'layer-population',
    name: 'Population & Megacities',
    category: LayerCategory.Data,
    icon: '👥',
    description: 'Global urban megacities, population density metrics, and regional demographics',
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
    this.renderer?.setTypeVisible(EntityType.City, true);
  }

  disable(): void {
    this.enabled = false;
    this.renderer?.setTypeVisible(EntityType.City, false);
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

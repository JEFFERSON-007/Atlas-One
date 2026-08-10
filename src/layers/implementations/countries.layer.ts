/**
 * CountriesLayer — ILayer wrapper for country boundaries and intelligence visibility.
 */

import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import { EntityType } from '../../twin/entity/geospatial-entity.types';
import type { EntityRenderer } from '../../twin/rendering/entity-renderer';

export class CountriesLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'layer-countries',
    name: 'Countries Intelligence',
    category: LayerCategory.Reference,
    icon: '🌐',
    description: 'REST Countries 250+ country boundaries, populations, capitals, and demographics',
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
    this.renderer?.setTypeVisible(EntityType.Country, true);
  }

  disable(): void {
    this.enabled = false;
    this.renderer?.setTypeVisible(EntityType.Country, false);
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

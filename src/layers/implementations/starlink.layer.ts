/**
 * StarlinkLayer — ILayer wrapper for SpaceX Starlink constellation.
 */

import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import { ObjectType } from '../../mobility/dynamic-object.types';
import type { ObjectRenderer } from '../../mobility/rendering/object-renderer';

export class StarlinkLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'layer-starlink',
    name: 'Starlink Constellation',
    category: LayerCategory.Data,
    icon: '⭐',
    description: 'SpaceX Starlink broadband satellite constellation in Low Earth Orbit',
    defaultEnabled: true,
  };

  private enabled = true;
  private renderer: ObjectRenderer | null = null;

  constructor(renderer: ObjectRenderer) {
    this.renderer = renderer;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  init(_viewer: Viewer): void {}

  enable(): void {
    this.enabled = true;
    this.renderer?.setTypeVisible(ObjectType.Starlink, true);
  }

  disable(): void {
    this.enabled = false;
    this.renderer?.setTypeVisible(ObjectType.Starlink, false);
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

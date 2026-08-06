/**
 * ShipsLayer — ILayer wrapper for vessel tracking visibility.
 */

import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import { ObjectType } from '../../mobility/dynamic-object.types';
import type { ObjectRenderer } from '../../mobility/rendering/object-renderer';

export class ShipsLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'layer-ships',
    name: 'Maritime Vessels',
    category: LayerCategory.Data,
    icon: '🚢',
    description: 'AIS cargo, tanker, passenger, and fishing vessels across major shipping lanes',
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
    this.renderer?.setTypeVisible(ObjectType.Ship, true);
  }

  disable(): void {
    this.enabled = false;
    this.renderer?.setTypeVisible(ObjectType.Ship, false);
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

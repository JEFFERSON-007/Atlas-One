/**
 * GPSConstellationLayer — ILayer wrapper for GNSS satellite constellations (GPS, GLONASS, Galileo, BeiDou).
 */

import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import { ObjectType } from '../../mobility/dynamic-object.types';
import type { ObjectRenderer } from '../../mobility/rendering/object-renderer';

export class GPSConstellationLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'layer-gps',
    name: 'GNSS / GPS Satellites',
    category: LayerCategory.Data,
    icon: '📡',
    description: 'GPS, GLONASS, Galileo, and BeiDou navigation satellite constellations',
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
    this.renderer?.setTypeVisible(ObjectType.GPS, true);
    this.renderer?.setTypeVisible(ObjectType.GLONASS, true);
    this.renderer?.setTypeVisible(ObjectType.Galileo, true);
    this.renderer?.setTypeVisible(ObjectType.BeiDou, true);
  }

  disable(): void {
    this.enabled = false;
    this.renderer?.setTypeVisible(ObjectType.GPS, false);
    this.renderer?.setTypeVisible(ObjectType.GLONASS, false);
    this.renderer?.setTypeVisible(ObjectType.Galileo, false);
    this.renderer?.setTypeVisible(ObjectType.BeiDou, false);
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

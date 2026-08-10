/**
 * InfrastructureLayer — ILayer wrapper for power plants, hospitals, universities, telecom, and ground stations.
 */

import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import { EntityType } from '../../twin/entity/geospatial-entity.types';
import type { EntityRenderer } from '../../twin/rendering/entity-renderer';

export class InfrastructureLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'layer-infrastructure',
    name: 'Critical Infrastructure',
    category: LayerCategory.Data,
    icon: '⚡',
    description: 'Power plants, hospitals, universities, telecom towers, and satellite ground stations',
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
    this.renderer?.setTypeVisible(EntityType.PowerPlant, true);
    this.renderer?.setTypeVisible(EntityType.Hospital, true);
    this.renderer?.setTypeVisible(EntityType.University, true);
    this.renderer?.setTypeVisible(EntityType.TelecommunicationFacility, true);
    this.renderer?.setTypeVisible(EntityType.SatelliteGroundStation, true);
  }

  disable(): void {
    this.enabled = false;
    this.renderer?.setTypeVisible(EntityType.PowerPlant, false);
    this.renderer?.setTypeVisible(EntityType.Hospital, false);
    this.renderer?.setTypeVisible(EntityType.University, false);
    this.renderer?.setTypeVisible(EntityType.TelecommunicationFacility, false);
    this.renderer?.setTypeVisible(EntityType.SatelliteGroundStation, false);
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

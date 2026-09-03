import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import type { EnvironmentalDataEngine } from '../../environment/engine/environmental-data-engine';
import { EnvironmentalVariable } from '../../environment/types/environmental.types';

export class AirQualityLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'layer-air-quality',
    name: 'Air Quality',
    category: LayerCategory.Data,
    icon: '🏭',
    description: 'Air quality monitoring stations from OpenAQ',
    defaultEnabled: false,
  };

  private enabled = false;
  private engine: EnvironmentalDataEngine | null = null;

  constructor(engine: EnvironmentalDataEngine) { this.engine = engine; }
  isEnabled(): boolean { return this.enabled; }
  init(_viewer: Viewer): void {}
  enable(): void {
    this.enabled = true;
    if (this.engine) {
      void this.engine.query({
        variable: EnvironmentalVariable.PM25,
        bounds: { north: 70, south: -60, east: 180, west: -180 },
        limit: 100,
      });
    }
  }
  disable(): void { this.enabled = false; }
  toggle(): boolean { if (this.enabled) this.disable(); else this.enable(); return this.enabled; }
  dispose(): void { this.engine = null; }
}

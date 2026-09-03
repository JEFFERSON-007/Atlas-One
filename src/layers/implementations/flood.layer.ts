import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import type { EnvironmentalDataEngine } from '../../environment/engine/environmental-data-engine';
import { EnvironmentalVariable } from '../../environment/types/environmental.types';

export class FloodLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'layer-flood',
    name: 'Flood Monitoring',
    category: LayerCategory.Data,
    icon: '🌊',
    description: 'Flood extent and water level observations',
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
      void this.engine.query({ variable: EnvironmentalVariable.FloodExtent });
    }
  }
  disable(): void { this.enabled = false; }
  toggle(): boolean { if (this.enabled) this.disable(); else this.enable(); return this.enabled; }
  dispose(): void { this.engine = null; }
}

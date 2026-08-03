import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import type { HeatmapEngine } from '../../events/rendering/heatmap-engine';

export class HeatmapLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'layer-heatmap',
    name: 'Event Density Heatmap',
    category: LayerCategory.Overlay,
    icon: '🌡️',
    description: 'Density heatmap of global natural events',
    defaultEnabled: false,
  };

  private enabled = false;
  private engine: HeatmapEngine | null = null;

  constructor(engine: HeatmapEngine) { this.engine = engine; }
  isEnabled(): boolean { return this.enabled; }
  init(_viewer: Viewer): void {}
  enable(): void { this.enabled = true; this.engine?.setEnabled(true); }
  disable(): void { this.enabled = false; this.engine?.setEnabled(false); }
  toggle(): boolean { if (this.enabled) this.disable(); else this.enable(); return this.enabled; }
  dispose(): void { this.engine = null; }
}

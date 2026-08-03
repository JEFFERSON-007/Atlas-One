import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import { EventType } from '../../events/earth-event.types';
import type { EventRenderer } from '../../events/rendering/event-renderer';

export class VolcanoLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'layer-volcano',
    name: 'Volcanoes',
    category: LayerCategory.Data,
    icon: '🌋',
    description: 'Smithsonian / NASA Active Volcanoes',
    defaultEnabled: true,
  };

  private enabled = true;
  private renderer: EventRenderer | null = null;

  constructor(renderer: EventRenderer) { this.renderer = renderer; }
  isEnabled(): boolean { return this.enabled; }
  init(_viewer: Viewer): void {}
  enable(): void { this.enabled = true; this.renderer?.setTypeVisible(EventType.Volcano, true); }
  disable(): void { this.enabled = false; this.renderer?.setTypeVisible(EventType.Volcano, false); }
  toggle(): boolean { if (this.enabled) this.disable(); else this.enable(); return this.enabled; }
  dispose(): void { this.renderer = null; }
}

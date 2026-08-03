import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import { EventType } from '../../events/earth-event.types';
import type { EventRenderer } from '../../events/rendering/event-renderer';

export class TsunamiLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'layer-tsunami',
    name: 'Tsunami Alerts',
    category: LayerCategory.Data,
    icon: '🌊',
    description: 'GDACS & USGS Tsunami Warnings',
    defaultEnabled: true,
  };

  private enabled = true;
  private renderer: EventRenderer | null = null;

  constructor(renderer: EventRenderer) { this.renderer = renderer; }
  isEnabled(): boolean { return this.enabled; }
  init(_viewer: Viewer): void {}
  enable(): void { this.enabled = true; this.renderer?.setTypeVisible(EventType.Tsunami, true); }
  disable(): void { this.enabled = false; this.renderer?.setTypeVisible(EventType.Tsunami, false); }
  toggle(): boolean { if (this.enabled) this.disable(); else this.enable(); return this.enabled; }
  dispose(): void { this.renderer = null; }
}

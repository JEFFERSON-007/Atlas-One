import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import { EventType } from '../../events/earth-event.types';
import type { EventRenderer } from '../../events/rendering/event-renderer';

export class WildfireLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'layer-wildfire',
    name: 'Wildfires',
    category: LayerCategory.Data,
    icon: '🔥',
    description: 'NASA EONET Active Wildfire Monitoring',
    defaultEnabled: true,
  };

  private enabled = true;
  private renderer: EventRenderer | null = null;

  constructor(renderer: EventRenderer) {
    this.renderer = renderer;
  }

  isEnabled(): boolean { return this.enabled; }
  init(_viewer: Viewer): void {}
  enable(): void { this.enabled = true; this.renderer?.setTypeVisible(EventType.Wildfire, true); }
  disable(): void { this.enabled = false; this.renderer?.setTypeVisible(EventType.Wildfire, false); }
  toggle(): boolean { if (this.enabled) this.disable(); else this.enable(); return this.enabled; }
  dispose(): void { this.renderer = null; }
}

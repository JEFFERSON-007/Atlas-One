import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import { EventType } from '../../events/earth-event.types';
import type { EventRenderer } from '../../events/rendering/event-renderer';

export class LightningLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'layer-lightning',
    name: 'Lightning',
    category: LayerCategory.Data,
    icon: '⚡',
    description: 'Blitzortung Global Lightning Strikes',
    defaultEnabled: true,
  };

  private enabled = true;
  private renderer: EventRenderer | null = null;

  constructor(renderer: EventRenderer) { this.renderer = renderer; }
  isEnabled(): boolean { return this.enabled; }
  init(_viewer: Viewer): void {}
  enable(): void { this.enabled = true; this.renderer?.setTypeVisible(EventType.Lightning, true); }
  disable(): void { this.enabled = false; this.renderer?.setTypeVisible(EventType.Lightning, false); }
  toggle(): boolean { if (this.enabled) this.disable(); else this.enable(); return this.enabled; }
  dispose(): void { this.renderer = null; }
}

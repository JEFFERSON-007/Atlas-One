import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import { EventType } from '../../events/earth-event.types';
import type { EventRenderer } from '../../events/rendering/event-renderer';

export class StormLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'layer-storm',
    name: 'Severe Storms',
    category: LayerCategory.Data,
    icon: '🌀',
    description: 'NOAA NHC Active Cyclones & Typhoons',
    defaultEnabled: true,
  };

  private enabled = true;
  private renderer: EventRenderer | null = null;

  constructor(renderer: EventRenderer) { this.renderer = renderer; }
  isEnabled(): boolean { return this.enabled; }
  init(_viewer: Viewer): void {}
  enable(): void { this.enabled = true; this.renderer?.setTypeVisible(EventType.Storm, true); }
  disable(): void { this.enabled = false; this.renderer?.setTypeVisible(EventType.Storm, false); }
  toggle(): boolean { if (this.enabled) this.disable(); else this.enable(); return this.enabled; }
  dispose(): void { this.renderer = null; }
}

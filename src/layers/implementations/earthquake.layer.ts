/**
 * EarthquakeLayer — ILayer wrapper for the Earthquake Event Renderer.
 */

import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import { EventType } from '../../events/earth-event.types';
import type { EventRenderer } from '../../events/rendering/event-renderer';

export class EarthquakeLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'layer-earthquake',
    name: 'Earthquakes',
    category: LayerCategory.Data,
    icon: '🌍',
    description: 'USGS Real-time M2.5+ earthquakes worldwide',
    defaultEnabled: true,
  };

  private enabled = true;
  private renderer: EventRenderer | null = null;

  constructor(renderer: EventRenderer) {
    this.renderer = renderer;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  init(_viewer: Viewer): void {
    // Renderer initialized externally
  }

  enable(): void {
    this.enabled = true;
    this.renderer?.setTypeVisible(EventType.Earthquake, true);
  }

  disable(): void {
    this.enabled = false;
    this.renderer?.setTypeVisible(EventType.Earthquake, false);
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

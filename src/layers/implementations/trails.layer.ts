/**
 * TrailsLayer — ILayer wrapper for aircraft contrails and ship wake trails.
 */

import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import type { TrailEngine } from '../../mobility/rendering/trail-engine';

export class TrailsLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'layer-trails',
    name: 'Vehicle Motion Trails',
    category: LayerCategory.Overlay,
    icon: '✨',
    description: 'Aircraft contrails, ship wakes, and movement history vectors',
    defaultEnabled: true,
  };

  private enabled = true;
  private engine: TrailEngine | null = null;

  constructor(engine: TrailEngine) {
    this.engine = engine;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  init(_viewer: Viewer): void {}

  enable(): void {
    this.enabled = true;
    this.engine?.setEnabled(true);
  }

  disable(): void {
    this.enabled = false;
    this.engine?.setEnabled(false);
  }

  toggle(): boolean {
    if (this.enabled) this.disable();
    else this.enable();
    return this.enabled;
  }

  dispose(): void {
    this.engine = null;
  }
}

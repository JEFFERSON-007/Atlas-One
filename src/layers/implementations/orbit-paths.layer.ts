/**
 * OrbitPathsLayer — ILayer wrapper for 3D satellite orbit path visualization.
 */

import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import type { OrbitEngine } from '../../mobility/rendering/orbit-engine';

export class OrbitPathsLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'layer-orbit-paths',
    name: 'Orbital Paths',
    category: LayerCategory.Overlays,
    icon: '⭕',
    description: '3D projected orbital trajectories for satellites, ISS, and constellations',
    defaultEnabled: true,
  };

  private enabled = true;
  private engine: OrbitEngine | null = null;

  constructor(engine: OrbitEngine) {
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

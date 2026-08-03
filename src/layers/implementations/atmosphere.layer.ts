/**
 * AtmosphereLayer — ILayer implementation for toggling atmosphere effects.
 * Delegates to the AtmosphereRenderer in the GlobeManager.
 */

import type { Viewer } from 'cesium';
import type { ILayer, LayerMetadata } from '../layer.interface';
import { LayerCategory } from '../layer.interface';
import type { AtmosphereRenderer } from '../../globe/atmosphere/atmosphere-renderer';

/**
 * Layer toggle for atmosphere rendering (sky glow, fog, ground atmosphere).
 */
export class AtmosphereLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'atmosphere',
    name: 'Atmosphere',
    category: LayerCategory.Overlay,
    icon: '🌌',
    description: 'Atmospheric scattering and sky glow effects',
    defaultEnabled: true,
  };

  private enabled = true;
  private renderer: AtmosphereRenderer;

  constructor(renderer: AtmosphereRenderer) {
    this.renderer = renderer;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  init(_viewer: Viewer): void {
    // Renderer is already initialized by GlobeManager
  }

  enable(): void {
    this.enabled = true;
    this.renderer.setEnabled(true);
  }

  disable(): void {
    this.enabled = false;
    this.renderer.setEnabled(false);
  }

  toggle(): boolean {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this.enabled;
  }

  dispose(): void {
    // Renderer lifecycle managed by GlobeManager
  }
}

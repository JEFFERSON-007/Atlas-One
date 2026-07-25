/**
 * LayerRegistry — Central registry for managing all map layers.
 * Follows the Registry pattern for extensibility without modifying existing code.
 */

import type { Viewer } from 'cesium';
import type { ILayer, LayerId } from './layer.interface';
import { eventBus } from '../hooks/use-event-bus';
import { createLogger } from '../utils/logger';

const log = createLogger('LayerRegistry');

/**
 * Manages registration, initialization, and state of all map layers.
 */
export class LayerRegistry {
  private readonly layers = new Map<LayerId, ILayer>();
  private viewer: Viewer | null = null;

  /**
   * Sets the viewer instance for layer initialization.
   */
  setViewer(viewer: Viewer): void {
    this.viewer = viewer;
  }

  /**
   * Registers a layer and optionally initializes it.
   *
   * @param layer - Layer implementation
   */
  async register(layer: ILayer): Promise<void> {
    const { id } = layer.metadata;

    if (this.layers.has(id)) {
      log.warn(`Layer already registered: ${id}`);
      return;
    }

    this.layers.set(id, layer);

    // Initialize if viewer is available
    if (this.viewer) {
      try {
        await layer.init(this.viewer);
        // Apply default enabled state
        if (layer.metadata.defaultEnabled) {
          layer.enable();
        } else {
          layer.disable();
        }
        log.info(`Layer registered and initialized: ${id}`);
      } catch (error) {
        log.error(`Failed to initialize layer: ${id}`, error);
      }
    }

    eventBus.emit('layer:added', { layerId: id });
  }

  /**
   * Toggles a layer by ID.
   *
   * @param layerId - Layer identifier
   * @returns The new enabled state, or undefined if layer not found
   */
  toggle(layerId: LayerId): boolean | undefined {
    const layer = this.layers.get(layerId);
    if (!layer) {
      log.warn(`Layer not found: ${layerId}`);
      return undefined;
    }

    const newState = layer.toggle();
    eventBus.emit('layer:toggle', { layerId, enabled: newState });
    log.info(`Layer toggled: ${layerId} → ${newState ? 'ON' : 'OFF'}`);
    return newState;
  }

  /**
   * Gets a layer by ID.
   */
  get(layerId: LayerId): ILayer | undefined {
    return this.layers.get(layerId);
  }

  /**
   * Returns all registered layers.
   */
  getAll(): ILayer[] {
    return Array.from(this.layers.values());
  }

  /**
   * Removes and disposes a layer.
   */
  remove(layerId: LayerId): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.dispose();
      this.layers.delete(layerId);
      eventBus.emit('layer:removed', { layerId });
      log.info(`Layer removed: ${layerId}`);
    }
  }

  /**
   * Disposes all layers and clears the registry.
   */
  dispose(): void {
    for (const layer of this.layers.values()) {
      layer.dispose();
    }
    this.layers.clear();
    this.viewer = null;
    log.info('Layer registry disposed');
  }
}

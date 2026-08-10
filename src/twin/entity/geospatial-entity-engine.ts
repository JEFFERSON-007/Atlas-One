/**
 * GeospatialEntityEngine — Central orchestrator for the Digital Twin Entity Engine.
 * Coordinates geospatial providers, validation, storage, and spatial queries.
 */

import type { IGeospatialProvider } from '../providers/geospatial-provider.interface';
import { EntityStore } from './entity-store';
import { validateEntities } from './entity-validator';
import { eventBus } from '../../hooks/use-event-bus';
import { createLogger } from '../../utils/logger';

const log = createLogger('GeospatialEntityEngine');

export class GeospatialEntityEngine {
  readonly store: EntityStore;
  private readonly providers = new Map<string, IGeospatialProvider>();
  private running = false;

  constructor() {
    this.store = new EntityStore();
  }

  /** Registers a geospatial provider. */
  registerProvider(provider: IGeospatialProvider): void {
    const { id, name } = provider.info;

    if (this.providers.has(id)) {
      log.warn(`Provider already registered: ${id}`);
      return;
    }

    if (!provider.isAvailable()) {
      log.warn(`Provider ${name} is not available — skipping registration`);
      return;
    }

    this.providers.set(id, provider);
    log.info(`Provider registered: ${name} (${id})`);
  }

  /**
   * Starts all registered providers and fetches initial data.
   */
  async start(): Promise<void> {
    if (this.running) return;

    this.running = true;
    log.info(`Digital Twin Engine started with ${this.providers.size} providers`);

    // Fetch initial datasets in parallel
    const fetchPromises = Array.from(this.providers.values()).map(async (provider) => {
      try {
        eventBus.emit('twin-provider:fetch-start', { providerId: provider.info.id });
        const rawEntities = await provider.fetchEntities();
        const valid = validateEntities(rawEntities, provider.info.id);

        if (valid.length > 0) {
          this.store.upsert(valid);
        }

        eventBus.emit('twin-provider:fetch-complete', {
          providerId: provider.info.id,
          entityCount: valid.length,
          success: true,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        log.warn(`Provider ${provider.info.name} failed: ${msg}`);
        eventBus.emit('twin-provider:fetch-complete', {
          providerId: provider.info.id,
          entityCount: 0,
          success: false,
        });
      }
    });

    await Promise.allSettled(fetchPromises);

    eventBus.emit('notification:show', {
      message: `Global Digital Twin active — ${this.store.size} geospatial entities loaded`,
      type: 'info',
    });
  }

  /** Stops the engine. */
  stop(): void {
    this.running = false;
    log.info('Digital Twin Engine stopped');
  }

  /** Returns whether engine is running. */
  isRunning(): boolean {
    return this.running;
  }

  /** Returns registered providers metadata. */
  getProviderInfos(): import('../providers/geospatial-provider.interface').GeospatialProviderInfo[] {
    return Array.from(this.providers.values()).map((p) => p.info);
  }

  /** Returns entity statistics. */
  getStats(): {
    totalEntities: number;
    countsByType: Record<string, number>;
    providerCount: number;
    running: boolean;
  } {
    return {
      totalEntities: this.store.size,
      countsByType: this.store.getCountsByType(),
      providerCount: this.providers.size,
      running: this.running,
    };
  }

  /** Disposes engine resources. */
  dispose(): void {
    this.stop();
    this.store.dispose();
    for (const provider of this.providers.values()) {
      provider.dispose?.();
    }
    this.providers.clear();
    log.info('Digital Twin Engine disposed');
  }
}

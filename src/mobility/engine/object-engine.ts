/**
 * DynamicObjectEngine — Central orchestrator for the Mobility system.
 * Coordinates providers, validation, storage, interpolation, and rendering.
 * Entry point: register providers → start() → objects flow automatically.
 */

import type { IObjectProvider } from '../providers/object-provider.interface';
import { ObjectStore } from './object-store';
import { ObjectScheduler } from './object-scheduler';
import { validateObjects } from './object-validator';
import { eventBus } from '../../hooks/use-event-bus';
import { createLogger } from '../../utils/logger';

const log = createLogger('DynamicObjectEngine');

/**
 * The Dynamic Object Engine.
 * Manages the complete lifecycle: Provider → Normalize → Validate → Store.
 */
export class DynamicObjectEngine {
  readonly store: ObjectStore;
  private readonly scheduler: ObjectScheduler;
  private readonly providers = new Map<string, IObjectProvider>();
  private running = false;

  constructor() {
    this.store = new ObjectStore();
    this.scheduler = new ObjectScheduler();

    // Wire scheduler to store
    this.scheduler.onFetch((providerId, rawObjects) => {
      const valid = validateObjects(rawObjects, providerId);
      if (valid.length > 0) {
        this.store.upsert(valid);
      }
    });
  }

  /**
   * Registers a mobility provider.
   */
  registerProvider(provider: IObjectProvider): void {
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
    this.scheduler.register(provider);
    log.info(`Provider registered: ${name} (${id})`);
  }

  /**
   * Starts all registered providers.
   * Objects begin flowing into the store immediately.
   */
  start(): void {
    if (this.running) return;

    this.store.startStaleCleanup();
    this.scheduler.startAll();
    this.running = true;

    log.info(`Engine started with ${this.providers.size} providers`);
    eventBus.emit('notification:show', {
      message: `Mobility Engine active — ${this.providers.size} data sources connected`,
      type: 'info',
    });
  }

  /**
   * Stops all providers and pauses the engine.
   */
  stop(): void {
    if (!this.running) return;

    this.scheduler.stopAll();
    this.running = false;
    log.info('Engine stopped');
  }

  /**
   * Starts a specific provider by ID.
   */
  startProvider(providerId: string): void {
    this.scheduler.start(providerId);
  }

  /**
   * Stops a specific provider by ID.
   */
  stopProvider(providerId: string): void {
    this.scheduler.stop(providerId);
  }

  /**
   * Returns whether the engine is running.
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Returns registered provider count.
   */
  getProviderCount(): number {
    return this.providers.size;
  }

  /**
   * Returns all registered provider infos.
   */
  getProviderInfos(): import('../providers/object-provider.interface').ObjectProviderInfo[] {
    return Array.from(this.providers.values()).map((p) => p.info);
  }

  /**
   * Returns scheduler status for all providers.
   */
  getSchedulerStatus(): ReturnType<ObjectScheduler['getStatus']> {
    return this.scheduler.getStatus();
  }

  /**
   * Returns global object statistics.
   */
  getStats(): {
    totalObjects: number;
    countsByType: Record<string, number>;
    providerCount: number;
    running: boolean;
  } {
    return {
      totalObjects: this.store.size,
      countsByType: this.store.getCountsByType(),
      providerCount: this.providers.size,
      running: this.running,
    };
  }

  /**
   * Cleans up all resources.
   */
  dispose(): void {
    this.stop();
    this.store.dispose();
    this.scheduler.dispose();

    for (const provider of this.providers.values()) {
      provider.dispose?.();
    }
    this.providers.clear();

    log.info('Dynamic Object Engine disposed');
  }
}

/**
 * EarthEventEngine — Central orchestrator for the Earth Event system.
 * Coordinates providers, validation, storage, and scheduling.
 * Entry point: register providers → start() → events flow automatically.
 */

import type { IEventProvider } from '../providers/event-provider.interface';
import type { HistoricalDataProvider, HistoricalQuery } from '../../twin/time/historical-provider.interface';
import { EventStore } from './event-store';
import { EventScheduler } from './event-scheduler';
import { validateEvents } from './event-validator';
import { eventBus } from '../../hooks/use-event-bus';
import { createLogger } from '../../utils/logger';

const log = createLogger('EarthEventEngine');

/**
 * The Earth Event Engine.
 * Manages the complete lifecycle: Provider → Normalize → Validate → Store.
 */
export class EarthEventEngine {
  readonly store: EventStore;
  private readonly scheduler: EventScheduler;
  private readonly providers = new Map<string, IEventProvider>();
  private readonly historicalProviders = new Map<string, HistoricalDataProvider>();
  private running = false;

  constructor() {
    this.store = new EventStore();
    this.scheduler = new EventScheduler();

    // Wire scheduler to store
    this.scheduler.onFetch((providerId, rawEvents) => {
      const valid = validateEvents(rawEvents, providerId);
      if (valid.length > 0) {
        this.store.upsert(valid);
      }
    });
  }

  /**
   * Registers an event provider.
   * The provider must implement IEventProvider.
   *
   * @param provider - Provider to register
   */
  registerProvider(provider: IEventProvider): void {
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
   * Registers a historical data provider.
   */
  registerHistoricalProvider(provider: HistoricalDataProvider): void {
    if (this.historicalProviders.has(provider.id)) {
      log.warn(`Historical Provider already registered: ${provider.id}`);
      return;
    }
    this.historicalProviders.set(provider.id, provider);
    log.info(`Historical Provider registered: ${provider.id}`);
  }

  /**
   * Queries historical providers for a given time range.
   */
  async queryHistoricalData(query: HistoricalQuery): Promise<import('../../twin/time/historical-provider.interface').HistoricalDataResponse[]> {
    const promises = Array.from(this.historicalProviders.values()).map(provider => provider.getData(query));
    return Promise.all(promises);
  }

  /**
   * Starts all registered providers.
   * Events begin flowing into the store immediately.
   */
  start(): void {
    if (this.running) return;

    this.store.startExpirationCleanup();
    this.scheduler.startAll();
    this.running = true;

    log.info(`Engine started with ${this.providers.size} providers`);
    eventBus.emit('notification:show', {
      message: `Earth Event Engine active — ${this.providers.size} data sources connected`,
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
  getProviderInfos(): import('../providers/event-provider.interface').EventProviderInfo[] {
    return Array.from(this.providers.values()).map((p) => p.info);
  }

  /**
   * Returns scheduler status for all providers.
   */
  getSchedulerStatus(): ReturnType<EventScheduler['getStatus']> {
    return this.scheduler.getStatus();
  }

  /**
   * Returns global event statistics.
   */
  getStats(): {
    totalEvents: number;
    countsByType: Record<string, number>;
    providerCount: number;
    running: boolean;
  } {
    return {
      totalEvents: this.store.size,
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

    log.info('Earth Event Engine disposed');
  }
}

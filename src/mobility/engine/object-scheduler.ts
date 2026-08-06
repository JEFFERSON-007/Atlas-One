/**
 * ObjectScheduler — Manages polling intervals for all mobility providers.
 * Supports exponential backoff on failure, pause/resume, and provider-specific intervals.
 */

import type { IObjectProvider } from '../providers/object-provider.interface';
import type { DynamicObject } from '../dynamic-object.types';
import { createLogger } from '../../utils/logger';
import { eventBus } from '../../hooks/use-event-bus';

const log = createLogger('ObjectScheduler');

/** Maximum backoff interval in ms. */
const MAX_BACKOFF_MS = 120_000;

/** Per-provider scheduling state. */
interface SchedulerEntry {
  provider: IObjectProvider;
  timer: ReturnType<typeof setTimeout> | null;
  failCount: number;
  running: boolean;
  lastFetch: number;
}

type FetchCallback = (providerId: string, objects: DynamicObject[]) => void;

/**
 * Coordinates polling for all registered mobility data providers.
 */
export class ObjectScheduler {
  private readonly entries = new Map<string, SchedulerEntry>();
  private fetchCallback: FetchCallback | null = null;

  /**
   * Sets the callback invoked when a provider returns data.
   */
  onFetch(callback: FetchCallback): void {
    this.fetchCallback = callback;
  }

  /**
   * Registers a provider for scheduled polling.
   */
  register(provider: IObjectProvider): void {
    this.entries.set(provider.info.id, {
      provider,
      timer: null,
      failCount: 0,
      running: false,
      lastFetch: 0,
    });
  }

  /**
   * Starts polling for a specific provider.
   */
  start(providerId: string): void {
    const entry = this.entries.get(providerId);
    if (!entry || entry.running) return;

    entry.running = true;
    void this.poll(providerId);
    log.info(`Started polling: ${entry.provider.info.name}`);
  }

  /**
   * Starts all registered providers.
   */
  startAll(): void {
    for (const id of this.entries.keys()) {
      this.start(id);
    }
  }

  /**
   * Stops a specific provider.
   */
  stop(providerId: string): void {
    const entry = this.entries.get(providerId);
    if (!entry) return;

    entry.running = false;
    if (entry.timer) {
      clearTimeout(entry.timer);
      entry.timer = null;
    }
  }

  /**
   * Stops all providers.
   */
  stopAll(): void {
    for (const id of this.entries.keys()) {
      this.stop(id);
    }
  }

  /**
   * Returns status information for all providers.
   */
  getStatus(): Array<{
    id: string;
    name: string;
    running: boolean;
    failCount: number;
    lastFetch: number;
  }> {
    return Array.from(this.entries.entries()).map(([id, entry]) => ({
      id,
      name: entry.provider.info.name,
      running: entry.running,
      failCount: entry.failCount,
      lastFetch: entry.lastFetch,
    }));
  }

  /**
   * Cleans up all resources.
   */
  dispose(): void {
    this.stopAll();
    this.entries.clear();
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  /**
   * Executes a single poll cycle for a provider,
   * then schedules the next poll.
   */
  private async poll(providerId: string): Promise<void> {
    const entry = this.entries.get(providerId);
    if (!entry || !entry.running) return;

    eventBus.emit('mobility-provider:fetch-start', { providerId });

    try {
      const objects = await entry.provider.fetchObjects();
      entry.failCount = 0;
      entry.lastFetch = Date.now();

      if (this.fetchCallback) {
        this.fetchCallback(providerId, objects);
      }

      eventBus.emit('mobility-provider:fetch-complete', {
        providerId,
        objectCount: objects.length,
        success: true,
      });
    } catch (err) {
      entry.failCount++;
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.warn(`${entry.provider.info.name} fetch failed (attempt ${entry.failCount}): ${message}`);

      eventBus.emit('mobility-provider:fetch-complete', {
        providerId,
        objectCount: 0,
        success: false,
      });
    }

    // Schedule next poll with backoff
    if (entry.running) {
      const baseInterval = entry.provider.info.updateIntervalSeconds * 1000;
      const backoff = entry.failCount > 0
        ? Math.min(baseInterval * Math.pow(2, entry.failCount), MAX_BACKOFF_MS)
        : baseInterval;

      entry.timer = setTimeout(() => {
        void this.poll(providerId);
      }, backoff);
    }
  }
}

/**
 * EventScheduler — Manages polling intervals for all registered event providers.
 * Each provider runs on its own independent timer with rate limit protection
 * and exponential backoff on errors.
 */

import type { IEventProvider } from '../providers/event-provider.interface';
import { eventBus } from '../../hooks/use-event-bus';
import { createLogger } from '../../utils/logger';

const log = createLogger('EventScheduler');

/** Maximum consecutive failures before pausing a provider. */
const MAX_CONSECUTIVE_FAILURES = 5;

/** Maximum backoff time in milliseconds (5 minutes). */
const MAX_BACKOFF_MS = 300_000;

/** Tracks state for a single provider's polling schedule. */
interface ProviderSchedule {
  provider: IEventProvider;
  intervalMs: number;
  timerId: ReturnType<typeof setTimeout> | null;
  running: boolean;
  paused: boolean;
  consecutiveFailures: number;
  lastFetch: Date | null;
  fetchCount: number;
}

/**
 * Callback for when a provider completes a fetch cycle.
 */
export type SchedulerFetchCallback = (
  providerId: string,
  events: import('../earth-event.types').EarthEvent[],
) => void;

/**
 * Schedules and manages recurring fetches for all event providers.
 */
export class EventScheduler {
  private readonly schedules = new Map<string, ProviderSchedule>();
  private fetchCallback: SchedulerFetchCallback | null = null;

  /**
   * Sets the callback invoked after each successful provider fetch.
   */
  onFetch(callback: SchedulerFetchCallback): void {
    this.fetchCallback = callback;
  }

  /**
   * Registers a provider with its polling schedule.
   *
   * @param provider - Event provider to schedule
   */
  register(provider: IEventProvider): void {
    const { id, updateIntervalSeconds } = provider.info;

    if (this.schedules.has(id)) {
      log.warn(`Provider already scheduled: ${id}`);
      return;
    }

    this.schedules.set(id, {
      provider,
      intervalMs: updateIntervalSeconds * 1000,
      timerId: null,
      running: false,
      paused: false,
      consecutiveFailures: 0,
      lastFetch: null,
      fetchCount: 0,
    });

    log.info(`Provider registered: ${id} (interval: ${updateIntervalSeconds}s)`);
  }

  /**
   * Starts all registered providers.
   * Performs an immediate first fetch, then schedules recurring.
   */
  startAll(): void {
    for (const [id] of this.schedules) {
      this.start(id);
    }
  }

  /**
   * Starts a specific provider by ID.
   */
  start(providerId: string): void {
    const schedule = this.schedules.get(providerId);
    if (!schedule) {
      log.warn(`Cannot start unknown provider: ${providerId}`);
      return;
    }

    if (schedule.running) return;
    schedule.running = true;
    schedule.paused = false;

    // Immediate first fetch
    void this.executeFetch(schedule);
  }

  /**
   * Stops a specific provider.
   */
  stop(providerId: string): void {
    const schedule = this.schedules.get(providerId);
    if (!schedule) return;

    schedule.running = false;
    if (schedule.timerId !== null) {
      clearTimeout(schedule.timerId);
      schedule.timerId = null;
    }

    log.info(`Provider stopped: ${providerId}`);
  }

  /**
   * Pauses a provider (remembers running state for resume).
   */
  pause(providerId: string): void {
    const schedule = this.schedules.get(providerId);
    if (!schedule || !schedule.running) return;

    schedule.paused = true;
    if (schedule.timerId !== null) {
      clearTimeout(schedule.timerId);
      schedule.timerId = null;
    }

    log.info(`Provider paused: ${providerId}`);
  }

  /**
   * Resumes a paused provider.
   */
  resume(providerId: string): void {
    const schedule = this.schedules.get(providerId);
    if (!schedule || !schedule.paused) return;

    schedule.paused = false;
    void this.executeFetch(schedule);
    log.info(`Provider resumed: ${providerId}`);
  }

  /**
   * Stops all providers.
   */
  stopAll(): void {
    for (const [id] of this.schedules) {
      this.stop(id);
    }
  }

  /**
   * Returns status of all scheduled providers.
   */
  getStatus(): Record<string, { running: boolean; paused: boolean; lastFetch: Date | null; fetchCount: number; failures: number }> {
    const status: Record<string, { running: boolean; paused: boolean; lastFetch: Date | null; fetchCount: number; failures: number }> = {};
    for (const [id, schedule] of this.schedules) {
      status[id] = {
        running: schedule.running,
        paused: schedule.paused,
        lastFetch: schedule.lastFetch,
        fetchCount: schedule.fetchCount,
        failures: schedule.consecutiveFailures,
      };
    }
    return status;
  }

  /**
   * Disposes all schedules and clears state.
   */
  dispose(): void {
    this.stopAll();
    this.schedules.clear();
    this.fetchCallback = null;
    log.info('Event scheduler disposed');
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  /**
   * Executes a fetch cycle for a provider and schedules the next one.
   */
  private async executeFetch(schedule: ProviderSchedule): Promise<void> {
    if (!schedule.running || schedule.paused) return;

    const { id } = schedule.provider.info;

    try {
      eventBus.emit('provider:fetch-start', { providerId: id });

      const events = await schedule.provider.fetchEvents();

      schedule.consecutiveFailures = 0;
      schedule.lastFetch = new Date();
      schedule.fetchCount++;

      if (this.fetchCallback) {
        this.fetchCallback(id, events);
      }

      eventBus.emit('provider:fetch-complete', {
        providerId: id,
        eventCount: events.length,
        success: true,
      });

      log.info(`${id}: Fetched ${events.length} events (total fetches: ${schedule.fetchCount})`);
    } catch (error) {
      schedule.consecutiveFailures++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      eventBus.emit('provider:error', {
        providerId: id,
        message: errorMsg,
      });

      if (schedule.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        log.error(`${id}: ${MAX_CONSECUTIVE_FAILURES} consecutive failures — pausing provider`);
        schedule.paused = true;
        return;
      }

      log.warn(`${id}: Fetch failed (attempt ${schedule.consecutiveFailures}): ${errorMsg}`);
    }

    // Schedule next fetch with backoff
    if (schedule.running && !schedule.paused) {
      const backoff = schedule.consecutiveFailures > 0
        ? Math.min(schedule.intervalMs * Math.pow(2, schedule.consecutiveFailures), MAX_BACKOFF_MS)
        : schedule.intervalMs;

      schedule.timerId = setTimeout(() => {
        void this.executeFetch(schedule);
      }, backoff);
    }
  }
}

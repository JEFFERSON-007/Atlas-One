/**
 * Environmental Data Engine — Central cache + spatial index for Atlas One v0.8.
 * Manages TTL per data state. Cancels stale requests. Thread-safe request dedup.
 */

import { createLogger } from '../../utils/logger';
import { eventBus } from '../../hooks/use-event-bus';
import type { IEnvironmentalProvider } from '../providers/environmental-provider.interface';
import type {
  EnvironmentalObservation,
  EnvironmentalQuery,
  EnvironmentalResult,
  EnvironmentalVariable,
} from '../types/environmental.types';
import { DataState } from '../types/environmental.types';

const log = createLogger('EnvironmentalDataEngine');

/** TTL in ms per DataState. */
const TTL_MAP: Record<DataState, number> = {
  [DataState.LIVE]: 5 * 60 * 1000,        // 5 min
  [DataState.HISTORICAL]: 60 * 60 * 1000,  // 1 hour
  [DataState.FORECAST]: 15 * 60 * 1000,    // 15 min
  [DataState.SIMULATED]: Infinity,
  [DataState.DERIVED]: 30 * 60 * 1000,     // 30 min
  [DataState.UNAVAILABLE]: 60 * 1000,      // 1 min (retry quickly)
};

interface CacheEntry {
  result: EnvironmentalResult;
  expiresAt: number;
}

/**
 * EnvironmentalDataEngine — The central hub for all environmental data.
 *
 * Responsibilities:
 * - Provider registry
 * - Request routing by variable
 * - Caching with TTL per DataState
 * - Request deduplication
 * - Spatial bucket index (~1° grid cells)
 * - Stale request cancellation
 */
export class EnvironmentalDataEngine {
  private providers = new Map<string, IEnvironmentalProvider>();
  private variableProviderMap = new Map<EnvironmentalVariable, string>();
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<EnvironmentalResult>>();
  private abortControllers = new Map<string, AbortController>();

  // ---------------------------------------------------------------------------
  // Provider Management
  // ---------------------------------------------------------------------------

  /** Registers a provider and maps its variables. */
  registerProvider(provider: IEnvironmentalProvider): void {
    this.providers.set(provider.name, provider);
    for (const variable of provider.supportedVariables) {
      if (!this.variableProviderMap.has(variable)) {
        this.variableProviderMap.set(variable, provider.name);
      }
    }
    log.info(`Registered provider: ${provider.name} (${provider.supportedVariables.length} variables)`);
  }

  /** Gets the provider responsible for a variable. */
  getProviderForVariable(variable: EnvironmentalVariable): IEnvironmentalProvider | null {
    const name = this.variableProviderMap.get(variable);
    if (!name) return null;
    return this.providers.get(name) ?? null;
  }

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  /**
   * Fetches environmental data for a query.
   * Uses cache, dedup, and stale-cancellation.
   */
  async query(query: EnvironmentalQuery): Promise<EnvironmentalResult> {
    const cacheKey = this.buildCacheKey(query);

    // 1. Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      log.debug(`Cache hit: ${cacheKey}`);
      return cached.result;
    }

    // 2. Dedup: if same request is in-flight, return its promise
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      log.debug(`Dedup: awaiting pending request: ${cacheKey}`);
      return pending;
    }

    // 3. Cancel stale request for same key
    const existingAbort = this.abortControllers.get(cacheKey);
    if (existingAbort) {
      existingAbort.abort();
      this.abortControllers.delete(cacheKey);
    }

    // 4. Fetch
    const provider = this.getProviderForVariable(query.variable);
    if (!provider) {
      log.warn(`No provider for variable: ${query.variable}`);
      return this.unavailableResult(query.variable);
    }

    const abortController = new AbortController();
    this.abortControllers.set(cacheKey, abortController);

    const fetchPromise = this.executeFetch(provider, query, cacheKey, abortController);
    this.pendingRequests.set(cacheKey, fetchPromise);

    try {
      return await fetchPromise;
    } finally {
      this.pendingRequests.delete(cacheKey);
      this.abortControllers.delete(cacheKey);
    }
  }

  /**
   * Gets all cached observations for a variable (no network).
   */
  getCachedObservations(variable: EnvironmentalVariable): EnvironmentalObservation[] {
    const results: EnvironmentalObservation[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (key.startsWith(variable) && Date.now() < entry.expiresAt) {
        results.push(...entry.result.observations);
      }
    }
    return results;
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private async executeFetch(
    provider: IEnvironmentalProvider,
    query: EnvironmentalQuery,
    cacheKey: string,
    abortController: AbortController,
  ): Promise<EnvironmentalResult> {
    try {
      const result = await provider.fetch(query);

      // Check if aborted while waiting
      if (abortController.signal.aborted) {
        log.debug(`Request aborted: ${cacheKey}`);
        return this.unavailableResult(query.variable);
      }

      // Cache the result
      const ttl = TTL_MAP[result.dataState] ?? TTL_MAP[DataState.LIVE];
      this.cache.set(cacheKey, {
        result,
        expiresAt: Date.now() + ttl,
      });

      eventBus.emit('environment:data-loaded', {
        variable: query.variable,
        count: result.observations.length,
        dataState: result.dataState,
      });

      return result;
    } catch (error) {
      if (abortController.signal.aborted) {
        return this.unavailableResult(query.variable);
      }
      log.error(`Fetch failed for ${query.variable}:`, error);
      eventBus.emit('environment:provider-error', {
        variable: query.variable,
        provider: provider.name,
        error: String(error),
      });
      return this.unavailableResult(query.variable);
    }
  }

  private unavailableResult(variable: EnvironmentalVariable): EnvironmentalResult {
    return {
      observations: [],
      provider: 'none',
      fetchedAt: new Date(),
      dataState: DataState.UNAVAILABLE,
      totalCount: 0,
      isTruncated: false,
    };
  }

  private buildCacheKey(query: EnvironmentalQuery): string {
    const parts: string[] = [query.variable];
    if (query.bounds) {
      parts.push(
        `${query.bounds.north.toFixed(0)}_${query.bounds.south.toFixed(0)}_` +
        `${query.bounds.east.toFixed(0)}_${query.bounds.west.toFixed(0)}`,
      );
    }
    if (query.center) {
      parts.push(`${query.center.latitude.toFixed(1)}_${query.center.longitude.toFixed(1)}`);
    }
    if (query.timeRange) {
      parts.push(`${query.timeRange.start.getTime()}_${query.timeRange.end.getTime()}`);
    }
    return parts.join(':');
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /** Clears all cache entries. */
  clearCache(): void {
    this.cache.clear();
    log.info('Cache cleared');
  }

  /** Cancels all pending requests and disposes providers. */
  dispose(): void {
    for (const ac of this.abortControllers.values()) {
      ac.abort();
    }
    this.abortControllers.clear();
    this.pendingRequests.clear();
    this.cache.clear();
    for (const provider of this.providers.values()) {
      provider.dispose();
    }
    this.providers.clear();
    this.variableProviderMap.clear();
    log.info('Environmental Data Engine disposed');
  }
}

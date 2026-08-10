/**
 * CacheManager — High-performance client-side LRU cache with per-key TTL.
 * Prevents redundant network requests, respects provider caching rules,
 * and caps memory usage.
 */

import { createLogger } from '../../utils/logger';

const log = createLogger('CacheManager');

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

export class CacheManager {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly maxEntries: number;

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
  }

  /** Gets cached entry if present and unexpired. */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    // Refresh LRU order
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  /** Stores a value in the cache with a specified TTL in milliseconds. */
  set<T>(key: string, data: T, ttlMs = 300_000): void {
    if (this.cache.size >= this.maxEntries) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs,
    });
  }

  /** Removes a specific key. */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /** Clears all cached items. */
  clear(): void {
    this.cache.clear();
    log.info('Cache cleared');
  }

  /** Total cached items. */
  get size(): number {
    return this.cache.size;
  }
}

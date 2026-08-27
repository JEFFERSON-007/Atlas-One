/**
 * Temporal Cache — LRU caching layer for historical data requests to prevent memory bloating.
 */

import { createLogger } from '../../utils/logger';

const log = createLogger('TemporalCache');

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  sizeBytes: number;
}

export class TemporalCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly maxMemoryBytes: number;
  private currentMemoryBytes = 0;

  constructor(maxMemoryMB = 50) {
    this.maxMemoryBytes = maxMemoryMB * 1024 * 1024;
  }

  set<T>(key: string, data: T, ttlSeconds = 300, sizeBytes = 1024): void {
    // Evict old cache if setting this would exceed memory
    if (this.currentMemoryBytes + sizeBytes > this.maxMemoryBytes) {
      this.evictToFit(sizeBytes);
    }

    const expiresAt = Date.now() + ttlSeconds * 1000;
    
    // If overwriting, adjust memory
    if (this.cache.has(key)) {
      this.currentMemoryBytes -= this.cache.get(key)!.sizeBytes;
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt,
      sizeBytes,
    });

    this.currentMemoryBytes += sizeBytes;
    log.info(`Cached [${key}] - Cache size: ${(this.currentMemoryBytes / 1024 / 1024).toFixed(2)} MB`);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    // Refresh LRU timestamp
    entry.timestamp = Date.now();
    return entry.data as T;
  }

  delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentMemoryBytes -= entry.sizeBytes;
      this.cache.delete(key);
    }
  }

  clear(): void {
    this.cache.clear();
    this.currentMemoryBytes = 0;
    log.info('Cache cleared');
  }

  private evictToFit(neededBytes: number): void {
    // 1. Clean expired entries first
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        this.currentMemoryBytes -= entry.sizeBytes;
      }
    }

    if (this.currentMemoryBytes + neededBytes <= this.maxMemoryBytes) return;

    // 2. LRU eviction
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    for (const [key, entry] of entries) {
      if (this.currentMemoryBytes + neededBytes <= this.maxMemoryBytes) break;
      
      this.cache.delete(key);
      this.currentMemoryBytes -= entry.sizeBytes;
    }
  }
}

export const temporalCache = new TemporalCache(50); // Global instance with 50MB limit

/**
 * Data Normalizer — Converts raw provider payloads into EnvironmentalObservation[].
 * Each provider registers its own normalizer function.
 */

import { createLogger } from '../../utils/logger';
import type { EnvironmentalObservation } from '../types/environmental.types';
import { filterValidObservations } from './data-validator';

const log = createLogger('DataNormalizer');

/** A normalizer function that transforms raw provider data into observations. */
export type NormalizerFunction = (rawData: unknown) => Partial<EnvironmentalObservation>[];

/**
 * DataNormalizer — Registry of provider-specific normalizer functions.
 * After normalization, all observations pass through validation.
 */
export class DataNormalizer {
  private normalizers = new Map<string, NormalizerFunction>();

  /** Registers a normalizer for a specific provider. */
  registerNormalizer(providerName: string, fn: NormalizerFunction): void {
    this.normalizers.set(providerName, fn);
    log.info(`Registered normalizer for provider: ${providerName}`);
  }

  /**
   * Normalizes raw provider data into validated EnvironmentalObservation[].
   * Returns empty array if no normalizer is registered or all data is invalid.
   */
  normalize(providerName: string, rawData: unknown): EnvironmentalObservation[] {
    const normalizer = this.normalizers.get(providerName);
    if (!normalizer) {
      log.warn(`No normalizer registered for provider: ${providerName}`);
      return [];
    }

    try {
      const rawObservations = normalizer(rawData);
      return filterValidObservations(rawObservations);
    } catch (error) {
      log.error(`Normalization failed for provider ${providerName}:`, error);
      return [];
    }
  }
}

/**
 * API Client — Base HTTP client with error handling, timeout, and retry logic.
 */

import { createLogger } from '../utils/logger';

const log = createLogger('ApiClient');

/** Standard API response wrapper. */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

/** Configuration for API requests. */
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

const DEFAULT_TIMEOUT = 10_000; // 10 seconds
const DEFAULT_RETRIES = 2;

/**
 * Makes a GET request with timeout, retry, and error handling.
 *
 * @param url - Request URL
 * @param options - Request configuration
 * @returns Typed API response
 */
export async function apiGet<T>(
  url: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { timeout = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES, headers = {} } = options;

  let lastError: string | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        log.warn(`Rate limited on attempt ${attempt + 1}`);
        // Exponential backoff
        await sleep(1000 * Math.pow(2, attempt));
        continue;
      }

      if (!response.ok) {
        lastError = `HTTP ${response.status}: ${response.statusText}`;
        log.warn(`Request failed: ${lastError}`);
        return { data: null, error: lastError, status: response.status };
      }

      const data = (await response.json()) as T;
      return { data, error: null, status: response.status };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        lastError = 'Request timed out';
      } else {
        lastError = error instanceof Error ? error.message : 'Unknown error';
      }

      if (attempt < retries) {
        log.info(`Retrying request (attempt ${attempt + 2}/${retries + 1})`);
        await sleep(500 * Math.pow(2, attempt));
      }
    }
  }

  log.error(`All request attempts failed: ${lastError}`);
  return { data: null, error: lastError ?? 'Request failed', status: 0 };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

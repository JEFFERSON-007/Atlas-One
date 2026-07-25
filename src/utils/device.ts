/**
 * Device detection and performance tier estimation utilities.
 * Used to adapt rendering quality and UI layout.
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type PerformanceTier = 'low' | 'medium' | 'high';

/**
 * Detects the current device type based on viewport width and touch capability.
 *
 * @returns The detected device type
 */
export function detectDeviceType(): DeviceType {
  const width = window.innerWidth;
  const hasTouchScreen =
    'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (width < 768 && hasTouchScreen) return 'mobile';
  if (width < 1024 && hasTouchScreen) return 'tablet';
  return 'desktop';
}

/**
 * Estimates the performance tier of the current device.
 * Uses hardware concurrency, device memory (if available), and device type.
 *
 * @returns Estimated performance tier
 */
export function estimatePerformanceTier(): PerformanceTier {
  const cores = navigator.hardwareConcurrency ?? 2;
  const memory = (navigator as unknown as { deviceMemory?: number })
    .deviceMemory;
  const deviceType = detectDeviceType();

  if (deviceType === 'mobile') return 'low';
  if (cores >= 8 && (memory === undefined || memory >= 8)) return 'high';
  if (cores >= 4) return 'medium';
  return 'low';
}

/**
 * Checks if the user prefers reduced motion.
 *
 * @returns True if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Checks if the device supports touch input.
 *
 * @returns True if touch is available
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Generic throttle utility.
 * Ensures the function is called at most once per `limit` milliseconds.
 *
 * @param fn - The function to throttle
 * @param limit - Minimum time between invocations in milliseconds
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number,
): T {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const throttled = ((...args: unknown[]) => {
    const now = Date.now();
    const remaining = limit - (now - lastCall);

    if (remaining <= 0) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      fn(...args);
    } else if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  }) as T;

  return throttled;
}

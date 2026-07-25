/**
 * Generic debounce utility.
 * Delays function invocation until after `delay` milliseconds have elapsed
 * since the last call.
 *
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns A debounced version of the function with a `cancel` method
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: unknown[]) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

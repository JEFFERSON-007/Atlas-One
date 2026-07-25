import { describe, it, expect, vi } from 'vitest';
import { debounce } from '../../utils/debounce';

describe('debounce', () => {
  it('should delay function execution', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(199);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it('should reset timer on subsequent calls', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced();
    vi.advanceTimersByTime(150);
    debounced(); // Reset
    vi.advanceTimersByTime(150);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });

  it('should support cancel', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(300);
    expect(fn).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});

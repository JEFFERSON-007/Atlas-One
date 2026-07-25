/**
 * Resource disposal utilities for CesiumJS entities and subscriptions.
 * Prevents memory leaks by providing a centralized cleanup registry.
 */

export interface Disposable {
  dispose(): void;
}

/**
 * Registry that tracks disposable resources and cleans them up on demand.
 * Use this to register Cesium entities, event listeners, and animation frames.
 */
export class DisposalRegistry {
  private readonly disposables: Disposable[] = [];

  /**
   * Registers a disposable resource for later cleanup.
   *
   * @param disposable - Object with a dispose() method
   */
  register(disposable: Disposable): void {
    this.disposables.push(disposable);
  }

  /**
   * Registers a cleanup function as a disposable.
   *
   * @param fn - Cleanup function to call on disposal
   */
  registerFn(fn: () => void): void {
    this.disposables.push({ dispose: fn });
  }

  /**
   * Disposes all registered resources in reverse order (LIFO).
   */
  disposeAll(): void {
    while (this.disposables.length > 0) {
      const disposable = this.disposables.pop();
      try {
        disposable?.dispose();
      } catch {
        // Silently continue — disposal should not throw
      }
    }
  }
}

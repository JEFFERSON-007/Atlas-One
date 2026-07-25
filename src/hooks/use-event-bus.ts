/**
 * Typed event bus for decoupled communication between modules.
 * Implements a publish/subscribe pattern with strong TypeScript typing.
 */

/** Map of event names to their payload types. */
export interface AppEvents {
  'layer:toggle': { layerId: string; enabled: boolean };
  'layer:added': { layerId: string };
  'layer:removed': { layerId: string };
  'search:query': { query: string };
  'search:result': { lat: number; lng: number; label: string };
  'search:error': { message: string };
  'camera:flyTo': { lat: number; lng: number; altitude?: number };
  'camera:reset': void;
  'settings:changed': { key: string; value: unknown };
  'scene:ready': void;
  'scene:error': { message: string };
  'ui:panelToggle': { panelId: string; open: boolean };
  'notification:show': { message: string; type: 'info' | 'warn' | 'error' };
  'animation:complete': { name: string };
}

type EventCallback<T> = T extends void ? () => void : (payload: T) => void;

/**
 * Singleton event bus for application-wide event communication.
 * Provides type-safe subscribe/emit with automatic cleanup.
 */
class EventBus {
  private readonly listeners = new Map<string, Set<EventCallback<unknown>>>();

  /**
   * Subscribe to an event.
   *
   * @param event - Event name from AppEvents
   * @param callback - Handler function
   * @returns Unsubscribe function
   */
  on<K extends keyof AppEvents>(
    event: K,
    callback: EventCallback<AppEvents[K]>,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(callback as EventCallback<unknown>);

    return () => {
      set.delete(callback as EventCallback<unknown>);
    };
  }

  /**
   * Emit an event to all subscribers.
   *
   * @param event - Event name
   * @param payload - Event payload
   */
  emit<K extends keyof AppEvents>(
    event: K,
    ...args: AppEvents[K] extends void ? [] : [AppEvents[K]]
  ): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const callback of set) {
      try {
        if (args.length === 0) {
          (callback as () => void)();
        } else {
          callback(args[0]);
        }
      } catch {
        // Event handlers should not crash the bus
      }
    }
  }

  /**
   * Remove all listeners for a specific event or all events.
   *
   * @param event - Optional event name. If omitted, clears all events.
   */
  off(event?: keyof AppEvents): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

/** Global event bus singleton. */
export const eventBus = new EventBus();

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
  // v0.2 — Weather & Location events
  'weather:data': import('../api/providers/weather-provider.interface').WeatherResult;
  'weather:error': { message: string };
  'location:click': { lat: number; lng: number; alt: number };
  'info-panel:open': { lat: number; lng: number };
  'info-panel:close': void;
  // v0.3 — Earth Event Engine events
  'events:updated': { totalCount: number; addedCount: number; updatedCount: number };
  'events:added': { count: number; types: string[] };
  'events:removed': { id: string; type: string };
  'event:select': { eventId: string };
  'event:deselect': void;
  'provider:fetch-start': { providerId: string };
  'provider:fetch-complete': { providerId: string; eventCount: number; success: boolean };
  'provider:error': { providerId: string; message: string };
  // v0.4 — Dynamic Object Engine events
  'objects:updated': { totalCount: number; addedCount: number; updatedCount: number };
  'object:select': { objectId: string };
  'object:deselect': void;
  'mobility-provider:fetch-start': { providerId: string };
  'mobility-provider:fetch-complete': { providerId: string; objectCount: number; success: boolean };
  // v0.5 — Global Digital Twin events
  'entities:updated': { totalCount: number; addedCount: number; updatedCount: number };
  'selection:changed': import('../twin/selection/selection-manager').SelectionPayload;
  'twin-provider:fetch-start': { providerId: string };
  'twin-provider:fetch-complete': { providerId: string; entityCount: number; success: boolean };
  'lod:changed': { level: import('../twin/entity/geospatial-entity.types').LODLevel; cameraHeightKm: number };
  'time:updated': { currentTime: Date; isPaused: boolean; isLive: boolean; speedMultiplier: number };
  'terrain:hover': { latitude: number; longitude: number; elevationMeters: number };
  'terrain:exaggeration-changed': { multiplier: number };
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
        // @ts-expect-error - Callback signature is safely matched by emit type constraints
        callback(...args);
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

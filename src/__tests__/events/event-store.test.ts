import { describe, it, expect, beforeEach } from 'vitest';
import { EventStore } from '../../events/engine/event-store';
import { EventType, EventSeverity, EventPriority, EventStatus } from '../../events/earth-event.types';

describe('EventStore', () => {
  let store: EventStore;

  beforeEach(() => {
    store = new EventStore();
  });

  const sampleEvent = {
    id: 'usgs-test1',
    type: EventType.Earthquake,
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: null,
    timestamp: new Date(),
    severity: EventSeverity.Major,
    priority: EventPriority.High,
    status: EventStatus.Active,
    title: 'Test Earthquake',
    description: 'M6.5 San Francisco',
    color: '#f87171',
    icon: '🌍',
    source: 'https://earthquake.usgs.gov',
    confidence: 1.0,
    metadata: { magnitude: 6.5 },
    geometry: { type: 'point' as const, coordinates: { latitude: 37.7749, longitude: -122.4194 } },
    visible: true,
    animationState: { pulse: true, glow: false, flash: false, fadeIn: true, scale: 1.0 },
    providerName: 'usgs-earthquake',
    updateInterval: 60,
    expiration: null,
    boundingRegion: null,
  };

  it('should store and retrieve an event', () => {
    store.upsert([sampleEvent]);
    expect(store.size).toBe(1);
    expect(store.get('usgs-test1')).toEqual(sampleEvent);
  });

  it('should filter events by type', () => {
    store.upsert([sampleEvent]);
    const quakes = store.getByType(EventType.Earthquake);
    expect(quakes).toHaveLength(1);

    const fires = store.getByType(EventType.Wildfire);
    expect(fires).toHaveLength(0);
  });

  it('should remove an event by ID', () => {
    store.upsert([sampleEvent]);
    expect(store.remove('usgs-test1')).toBe(true);
    expect(store.size).toBe(0);
  });
});

/**
 * Historical Mock Provider — Generates deterministic historical events
 * (Earthquakes and Wildfires) to demonstrate the Earth Time Machine in GitHub Pages.
 */

import { HistoricalDataProvider, HistoricalQuery, HistoricalDataResponse, DataAvailability } from '../../twin/time/historical-provider.interface';
import { DataState } from '../../twin/time/temporal-state.types';
import { EarthEvent, EventType, EventSeverity, EventPriority, EventStatus } from '../earth-event.types';
import { createLogger } from '../../utils/logger';

const log = createLogger('HistoricalMockProvider');

export class HistoricalMockProvider implements HistoricalDataProvider {
  readonly id = 'historical-mock';

  // Seeded random number generator
  private seed(s: number) {
    return function() {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  }

  async getAvailability(): Promise<DataAvailability[]> {
    const now = new Date();
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(now.getFullYear() - 10);

    return [
      {
        dataset: 'earthquakes',
        availableRanges: [{ start: tenYearsAgo, end: now }],
        resolutionMinutes: 60,
      },
      {
        dataset: 'wildfires',
        availableRanges: [{ start: tenYearsAgo, end: now }],
        resolutionMinutes: 1440,
      }
    ];
  }

  async getData(query: HistoricalQuery): Promise<HistoricalDataResponse> {
    const events: EarthEvent[] = [];
    const { dataset, timeRange } = query;
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Generate deterministic events based on the time window
    const durationMs = timeRange.end.getTime() - timeRange.start.getTime();
    const days = Math.max(1, durationMs / (1000 * 60 * 60 * 24));
    
    // Seed based on day and dataset so it's consistent
    const seedVal = timeRange.start.getTime() + (dataset === 'earthquakes' ? 1 : 2);
    const random = this.seed(seedVal);

    const count = Math.min(100, Math.floor(days * (dataset === 'earthquakes' ? 5 : 2)));

    for (let i = 0; i < count; i++) {
      const timeOffset = random() * durationMs;
      const eventTime = new Date(timeRange.start.getTime() + timeOffset);
      
      const lat = (random() * 140) - 70; // Avoid poles
      const lng = (random() * 360) - 180;
      const id = `${this.id}-${dataset}-${eventTime.getTime()}-${i}`;

      if (dataset === 'earthquakes') {
        const magnitude = 4.0 + (random() * 5.0); // 4.0 to 9.0
        events.push({
          id,
          type: EventType.Earthquake,
          latitude: lat,
          longitude: lng,
          altitude: -10000,
          timestamp: eventTime,
          severity: magnitude > 7 ? EventSeverity.Severe : magnitude > 5 ? EventSeverity.Moderate : EventSeverity.Minor,
          priority: EventPriority.Normal,
          status: EventStatus.Archived,
          title: `M${magnitude.toFixed(1)} Historical Earthquake`,
          description: `Historical earthquake observation.`,
          color: '#f87171',
          icon: '🌍',
          source: 'Mock Provider',
          confidence: 1.0,
          metadata: { magnitude },
          geometry: { type: 'point', coordinates: { latitude: lat, longitude: lng } },
          visible: true,
          animationState: { pulse: false, glow: false, flash: false, fadeIn: true, scale: 1 },
          providerName: 'Historical Mock',
          updateInterval: 0,
          expiration: new Date(eventTime.getTime() + 60 * 60 * 1000), // 1 hour duration
          boundingRegion: null,
        });
      } else if (dataset === 'wildfires') {
        events.push({
          id,
          type: EventType.Wildfire,
          latitude: lat,
          longitude: lng,
          altitude: 0,
          timestamp: eventTime,
          severity: EventSeverity.Major,
          priority: EventPriority.Normal,
          status: EventStatus.Archived,
          title: `Historical Wildfire Detection`,
          description: `Historical fire detection via satellite.`,
          color: '#fb923c',
          icon: '🔥',
          source: 'Mock Provider',
          confidence: 0.9,
          metadata: {},
          geometry: { type: 'point', coordinates: { latitude: lat, longitude: lng } },
          visible: true,
          animationState: { pulse: false, glow: false, flash: false, fadeIn: true, scale: 1 },
          providerName: 'Historical Mock',
          updateInterval: 0,
          expiration: new Date(eventTime.getTime() + 24 * 60 * 60 * 1000), // 24 hour duration
          boundingRegion: null,
        });
      }
    }

    log.info(`Generated ${events.length} historical ${dataset} events`);

    return {
      state: DataState.HISTORICAL,
      retrievedAt: new Date(),
      events,
    };
  }

  async getNearestTimestamp(_dataset: string, time: Date): Promise<Date | null> {
    return time; // Mock implies continuous data
  }
}

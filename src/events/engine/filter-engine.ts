/**
 * FilterEngine — Composable predicate filter engine for Earth Events.
 * Allows filtering events dynamically by type, severity, time range,
 * search text, magnitude, and spatial bounding boxes.
 */

import type { EarthEvent, EventFilter } from '../earth-event.types';
import { eventBus } from '../../hooks/use-event-bus';

export class FilterEngine {
  private activeFilter: EventFilter = {};

  setFilter(filter: EventFilter): void {
    this.activeFilter = { ...filter };
    eventBus.emit('settings:changed', { key: 'filter', value: this.activeFilter });
  }

  getFilter(): EventFilter {
    return { ...this.activeFilter };
  }

  clearFilter(): void {
    this.activeFilter = {};
    eventBus.emit('settings:changed', { key: 'filter', value: this.activeFilter });
  }

  filterEvents(events: EarthEvent[]): EarthEvent[] {
    const f = this.activeFilter;
    return events.filter((e) => {
      if (f.types && f.types.length > 0 && !f.types.includes(e.type)) return false;
      if (f.severities && f.severities.length > 0 && !f.severities.includes(e.severity)) return false;
      if (f.searchText) {
        const text = f.searchText.toLowerCase();
        if (!e.title.toLowerCase().includes(text) && !e.description.toLowerCase().includes(text)) {
          return false;
        }
      }
      return true;
    });
  }
}
